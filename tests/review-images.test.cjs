const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { test } = require('node:test');

require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText,
  filename,
);
const { validateReviewPhotos } = require('../src/lib/review-images.ts');
const MiB = 1024 * 1024;

// Fixtures exercise signature checks; they are not full image-decoder fixtures.
function jpeg(size = 32) {
  const data = Buffer.alloc(size);
  data.set([0xff, 0xd8, 0xff, 0xe0]);
  data.set([0xff, 0xd9], size - 2);
  return { data, mimeType: 'image/jpeg' };
}
function png() {
  const data = Buffer.alloc(33);
  data.set([137, 80, 78, 71, 13, 10, 26, 10]);
  data.writeUInt32BE(13, 8);
  data.write('IHDR', 12);
  data.writeUInt32BE(1, 16);
  data.writeUInt32BE(1, 20);
  return { data, mimeType: 'image/png' };
}
function webp() {
  const data = Buffer.alloc(24);
  data.write('RIFF');
  data.writeUInt32LE(data.length - 8, 4);
  data.write('WEBP', 8);
  data.write('VP8 ', 12);
  return { data, mimeType: 'image/webp' };
}
const rejected = input => assert.throws(() => validateReviewPhotos(input), error => error.status === 400);

test('Review photos: optional empty selection and JPEG/PNG/WebP signatures accepted', () => {
  assert.deepEqual(validateReviewPhotos([]), []);
  const input = [jpeg(), png(), webp()];
  const result = validateReviewPhotos(input);
  assert.equal(result.length, 3);
  for (let i = 0; i < input.length; i++) {
    assert.equal(result[i].mimeType, input[i].mimeType);
    assert.deepEqual(result[i].data, input[i].data);
    assert.equal(result[i].sha256, createHash('sha256').update(input[i].data).digest('hex'));
    assert.equal(Object.hasOwn(input[i], 'sha256'), false, 'validation must not mutate caller data');
  }
});

test('Review photos: same content has stable hash for retry, different content has different hash', () => {
  const first = jpeg();
  const changed = jpeg();
  changed.data[8] = 42;
  const [a, b, c] = validateReviewPhotos([first, { ...first, data: Buffer.from(first.data) }, changed]);
  assert.equal(a.sha256, b.sha256);
  assert.notEqual(a.sha256, c.sha256);
});

test('Review photos: rejects more than three files and empty image', () => {
  rejected([jpeg(), jpeg(), jpeg(), jpeg()]);
  rejected([{ data: Buffer.alloc(0), mimeType: 'image/jpeg' }]);
});

test('Review photos: accepts exact 2 MiB per-file and 3 MiB total boundaries', () => {
  assert.equal(validateReviewPhotos([jpeg(2 * MiB), jpeg(MiB)]).length, 2);
});

test('Review photos: rejects oversized file or combined upload even when individual files fit', () => {
  rejected([jpeg(2 * MiB + 1)]);
  rejected([jpeg(2 * MiB), jpeg(MiB + 1)]);
  rejected([jpeg(MiB + 1), jpeg(MiB), jpeg(MiB)]);
});

test('Review photos: MIME declarations must match bytes; unsupported formats cannot disguise themselves', () => {
  rejected([{ ...jpeg(), mimeType: 'image/png' }]);
  rejected([{ ...png(), mimeType: 'image/jpeg' }]);
  rejected([{ ...webp(), mimeType: 'image/png' }]);
  for (const mimeType of ['image/svg+xml', 'image/gif', 'image/heic', 'text/html', 'application/octet-stream']) {
    rejected([{ ...jpeg(), mimeType }]);
  }
  rejected([{ data: Buffer.from('<svg onload="alert(1)"></svg>'), mimeType: 'image/png' }]);
  rejected([{ data: Buffer.from('GIF89a-not-a-png'), mimeType: 'image/png' }]);
});

test('Review photos: rejects truncated or corrupted signature framing', () => {
  const brokenJpeg = jpeg();
  brokenJpeg.data[brokenJpeg.data.length - 1] = 0;
  rejected([brokenJpeg]);
  rejected([{ data: png().data.subarray(0, 16), mimeType: 'image/png' }]);
  const wrongChunk = png();
  wrongChunk.data.write('IDAT', 12);
  rejected([wrongChunk]);
  const wrongWebpSize = webp();
  wrongWebpSize.data.writeUInt32LE(200, 4);
  rejected([wrongWebpSize]);
});
