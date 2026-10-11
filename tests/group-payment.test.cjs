const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { splitAmounts, extractGroupCode, groupTotals, ticketValue, validTicket, groupActionSchema } = require('../src/lib/group-payment.ts');
const { createVietQrUrl } = require('../src/lib/sepay.ts');

test('every equal split conserves integer VND and deterministic remainder', () => {
  for (let count=2; count<=30; count++) for (const total of [100001,150000,999999]) {
    const amounts=splitAmounts(total,count); assert.equal(amounts.length,count); assert.equal(amounts.reduce((a,b)=>a+b),total);
    assert.ok(Math.max(...amounts)-Math.min(...amounts)<=1); assert.ok(amounts.every(Number.isInteger));
  }
  assert.deepEqual(splitAmounts(100000,3),[33334,33333,33333]);
  for(const parts of [[1,2,3],[-1,0,100001],[33333.3,33333.3,33333.4]]) assert.throws(()=>splitAmounts(100000,3,parts));
});
test('group reference cannot be confused with a booking or multiple intents',()=>{
  const a='GP'+'A'.repeat(24), b='GP'+'B'.repeat(24);
  assert.equal(extractGroupCode(`Chuyen tien ${a.toLowerCase()}`),a);
  assert.equal(extractGroupCode(`${a} ${a}`),a);
  for(const text of [`${a} ${b}`,`${a} DATSAN123`,`X${a}`,`${a}0`,'GP123']) assert.equal(extractGroupCode(text),null);
  const qr = new URL(createVietQrUrl(37500,a,{BANK_BIN:'970415',BANK_ACCOUNT_NO:'0001234703',BANK_ACCOUNT_NAME:'TEST'}));
  assert.equal(qr.searchParams.get('amount'),'37500'); assert.equal(qr.searchParams.get('addInfo'),a);
});
test('cash approval reserves the booking but does not increase money received',()=>{
  const shares=[{amount:50000,paymentId:'payment',cashApprovedAt:null},{amount:50000,paymentId:null,cashApprovedAt:null}];
  assert.deepEqual(groupTotals(shares),{total:100000,received:50000,remaining:50000,canConfirm:false});
  shares[1].cashApprovedAt=new Date(); assert.equal(groupTotals(shares).canConfirm,true); assert.equal(groupTotals(shares).received,50000);
});
test('ticket signatures bind a single share and reject tampering',()=>{
  process.env.AUTH_SECRET='group-test-secret-only-32-characters-long';
  const share={id:'a',ticketNonce:'nonce-a'};
  const ticket=ticketValue(share); assert.ok(validTicket(ticket,share));
  assert.equal(validTicket(ticket,{id:'b',ticketNonce:'nonce-a'}),false);
  assert.equal(validTicket(ticket,{id:'a',ticketNonce:'nonce-b'}),false);
  assert.equal(validTicket(ticket+'0',share),false);
});
test('actions reject duplicate allocations and client supplied amount/status/actor',()=>{
  for(const body of [{action:'COVER',shareIds:['a','a']},{action:'COLLECT_CASH',shareIds:['a'],reason:'test reason',amount:1},{action:'METHOD',method:'CASH',status:'PAID'},{action:'APPROVE_CASH',shareIds:['a'],reason:'test reason',actorId:'admin'}]) assert.equal(groupActionSchema.safeParse(body).success,false);
});
