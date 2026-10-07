const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const { GET } = require('../src/app/api/map/tiles/[z]/[x]/[y]/route.ts');

test('tile proxy rejects malformed, out of bounds and excessive zoom without fetching', async () => {
  const original = global.fetch;
  global.fetch = () => { throw new Error('Invalid coordinates must not reach upstream'); };
  try {
    for (const params of [{z:'20',x:'0',y:'0'}, {z:'1',x:'2',y:'0'}, {z:'1',x:'0',y:'2'}, {z:'1',x:'-1',y:'0'}, {z:'1',x:'../host',y:'0'}]) {
      assert.equal((await GET(new Request('https://example.com'), {params})).status, 400);
    }
  } finally { global.fetch = original; }
});

test('tile proxy identifies the app, preserves referrer and caches successful images for seven days', async () => {
  const original = global.fetch;
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://tile.openstreetmap.org/15/26018/14425.png');
    assert.match(options.headers['User-Agent'], /^SmashBook\/1\.0/);
    assert.equal(options.headers.Referer, 'https://example.com/venues');
    assert.equal(options.next.revalidate, 604800);
    return new Response(new Uint8Array([137,80,78,71]), { headers: {'Content-Type':'image/png'} });
  };
  try {
    const result = await GET(new Request('https://example.com', {headers:{referer:'https://example.com/venues'}}), {params:{z:'15',x:'26018',y:'14425'}});
    assert.equal(result.status, 200);
    assert.equal(result.headers.get('content-type'), 'image/png');
    assert.match(result.headers.get('cache-control'), /max-age=604800/);
    assert.deepEqual(new Uint8Array(await result.arrayBuffer()), new Uint8Array([137,80,78,71]));
  } finally { global.fetch = original; }
});

test('upstream errors and non-image responses never get cached as successful tiles', async () => {
  const original = global.fetch;
  try {
    for (const response of [new Response('denied', {status:403}), new Response('html', {headers:{'Content-Type':'text/html'}})]) {
      global.fetch = async () => response;
      const result = await GET(new Request('https://example.com'), {params:{z:'1',x:'0',y:'0'}});
      assert.equal(result.status, 503);
      assert.equal(result.headers.get('cache-control'), 'no-store');
    }
    global.fetch = async () => { throw new Error('timeout'); };
    assert.equal((await GET(new Request('https://example.com'), {params:{z:'1',x:'0',y:'0'}})).status, 503);
  } finally { global.fetch = original; }
});
