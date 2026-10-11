// Uses a new, unexposed PostgreSQL schema for every run. Never inserts production bookings.
const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const ts = require('typescript');
require('@next/env').loadEnvConfig(process.cwd());
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { PrismaClient } = require('@prisma/client');
const { runtimeDatabaseUrl } = require('../src/lib/database-url.ts');
const { createGroup, groupAction, getGroupView, expireGroups } = require('../src/services/group-payment.service.ts');
const { receiveSepayPayment } = require('../src/services/sepay.service.ts');
const { performAdminAction } = require('../src/services/admin.service.ts');
const { splitAmounts, extractGroupCode } = require('../src/lib/group-payment.ts');
const schema = 'group_test_' + crypto.randomBytes(6).toString('hex');
if (!/^group_test_[a-f0-9]{12}$/.test(schema)) throw new Error('Unsafe test schema');
const baseUrl = process.env.GROUP_TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!baseUrl) throw new Error('Database connection required');
const url = new URL(runtimeDatabaseUrl(baseUrl));
url.searchParams.set('schema', schema);
url.searchParams.set('connection_limit', '5');
const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
const config = { SEPAY_AUTH_MODE: 'hmac', SEPAY_WEBHOOK_SECRET: 'test-only-never-production', BANK_BIN: '970415', BANK_ACCOUNT_NO: '0001234703', BANK_ACCOUNT_NAME: 'TEST ONLY', SEPAY_BANK_GATEWAY: 'VietinBank', SEPAY_SUB_ACCOUNT: '' };
process.env.AUTH_SECRET = crypto.randomBytes(32).toString('hex');
let eventId = 1000; let bookingNo = 100;
function transfer(code, amount, patch = {}) { return { id: ++eventId, gateway: config.SEPAY_BANK_GATEWAY, accountNumber: config.BANK_ACCOUNT_NO, content: code, transferType: 'in', transferAmount: amount, ...patch }; }
const check = name => console.log('PASS:', name);
let created = false;
async function fixture(count = 4, total = 150000) {
  const date = new Date(Date.now() + 2 * 86400000); date.setUTCHours(0,0,0,0);
  const b = await db.booking.create({ data: { code: `DATSAN${++bookingNo}`, venueId: 'venue', userId: 'leader', customerName: 'Test leader', customerPhone: '0000000000', subtotal: total, total, paymentStatus: 'PENDING', paymentMethod: 'BANK_TRANSFER', expiresAt: new Date(Date.now()+600000), items: { create: { courtId: 'court', date, startMin: 600, endMin: 660, price: total } } } });
  const g = await createGroup(db, 'leader', { bookingCode: b.code, count }, config);
  return { b, token: g.inviteToken };
}
async function view(f, user='leader') { return getGroupView(db,user,f.token); }
async function action(f, user, a) { return groupAction(db,user,f.token,a,config); }
async function payOwn(f,user) { const v=await view(f,user); const i=v.intents[0]; assert.ok(i); return receiveSepayPayment(db,transfer(i.code,i.amount),config); }
async function main() {
  await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`); created = true;
  const ddl = require('node:child_process').execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], { encoding: 'utf8' });
  assert.ok(!/"public"\./.test(ddl), 'Test DDL must not target public');
  await db.$transaction(async tx => {
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
    for (const statement of ddl.split(';').map(s=>s.trim()).filter(Boolean)) await tx.$executeRawUnsafe(statement);
  }, { timeout: 120000 });
  for (const [id,role] of [['leader','CUSTOMER'],['m2','CUSTOMER'],['m3','CUSTOMER'],['m4','CUSTOMER'],['outsider','CUSTOMER'],['owner','OWNER'],['staff','STAFF'],['wrongStaff','STAFF']]) await db.user.create({data:{id,name:id,role}});
  await db.venue.create({data:{id:'venue',slug:'group-test',name:'GROUP TEST ONLY',address:'Test',district:'Test',lat:0,lng:0,phone:'000',ownerId:'owner',status:'ACTIVE',images:[],amenities:[],staff:{create:{userId:'staff'}},courts:{create:{id:'court',name:'Test court'}}}});
  assert.deepEqual(splitAmounts(100000,3),[33334,33333,33333]);
  assert.throws(()=>splitAmounts(100000,3,[1,2,3]));
  assert.equal(extractGroupCode('GP'+ 'A'.repeat(24)+' DATSAN123'),null);
  check('rounding conserves total; mixed references rejected');

  const f = await fixture();
  await Promise.all([action(f,'m2',{action:'JOIN',position:2}),action(f,'m3',{action:'JOIN',position:3}),action(f,'m4',{action:'JOIN',position:4})]);
  let v = await view(f); assert.equal(v.intents[0].amount,37500);
  assert.equal((await createGroup(db,'leader',{bookingCode:f.b.code,count:4},config)).inviteToken,f.token);
  await assert.rejects(action(f,'outsider',{action:'COVER',shareIds:[v.shares[0].id]}),e=>e.status===403);
  const legacy = await receiveSepayPayment(db,transfer(f.b.code,150000),config); assert.equal(legacy.result,'REVIEW_GROUP_LEGACY_QR');
  check('fixed group creation, idempotency, member authorization and legacy QR isolation');
  const m2 = await view(f,'m2'); const ev=transfer(m2.intents[0].code,37500);
  const dup=await Promise.all([receiveSepayPayment(db,ev,config),receiveSepayPayment(db,ev,config)]);
  assert.deepEqual(dup.map(x=>x.result).sort(),['DUPLICATE','GROUP_PAID']);
  v=await view(f); assert.equal(v.received,37500); assert.equal(v.paymentStatus,'PARTIALLY_PAID'); assert.equal(v.ticket,null);
  check('concurrent duplicate delivery counted once; no early ticket');
  await action(f,'leader',{action:'REQUEST_CASH_ALL'});
  v=await view(f); const unpaid=v.shares.filter(s=>!s.paid).map(s=>s.id);
  await assert.rejects(action(f,'wrongStaff',{action:'APPROVE_CASH',shareIds:unpaid,reason:'Test approval'}),e=>e.status===403);
  await action(f,'staff',{action:'APPROVE_CASH',shareIds:unpaid,reason:'Test cash approval'});
  v=await view(f); assert.equal(v.status,'CONFIRMED'); assert.equal(v.received,37500); assert.equal(v.ticket,null);
  await action(f,'staff',{action:'COLLECT_CASH',shareIds:[v.shares[2].id],reason:'Actually received test cash'});
  await assert.rejects(action(f,'staff',{action:'COLLECT_CASH',shareIds:[v.shares[2].id],reason:'Repeated test cash'}),e=>e.status===409);
  v=await view(f); assert.equal(v.received,75000);
  await action(f,'leader',{action:'COVER',shareIds:v.shares.filter(s=>!s.paid).map(s=>s.id)});
  v=await view(f); assert.equal(v.intents.length,1); assert.equal(v.intents[0].amount,75000);
  assert.equal((await payOwn(f,'leader')).result,'GROUP_PAID');
  v=await view(f); assert.equal(v.paymentStatus,'PAID'); assert.equal(v.received,150000); assert.ok(v.ticketQr);
  assert.equal(await db.payment.count({where:{bookingId:f.b.id}}),3);
  check('mixed cash/online, approval without receipt, per-share collection and leader coverage');
  await assert.rejects(performAdminAction(db,'owner',{action:'CASH_PAID',id:f.b.id,reason:'Legacy whole booking collect'}),e=>e.status===409);
  await assert.rejects(action(f,'staff',{action:'CHECK_IN_TICKET',ticket:v.ticket,reason:'Too early checkin'}),e=>e.status===409);
  const vn = new Date(Date.now()+7*3600000); const min=vn.getUTCHours()*60+vn.getUTCMinutes();
  await db.bookingItem.updateMany({where:{bookingId:f.b.id},data:{date:new Date(vn.toISOString().slice(0,10)),startMin:Math.max(0,min-5),endMin:Math.min(1440,min+60)}});
  await action(f,'staff',{action:'CHECK_IN_TICKET',ticket:v.ticket,reason:'Check in first member'});
  await assert.rejects(action(f,'staff',{action:'CHECK_IN_TICKET',ticket:v.ticket,reason:'Replay the same ticket'}),e=>e.status===409);
  const second=await view(f,'m2'); await action(f,'staff',{action:'CHECK_IN_TICKET',ticket:second.ticket,reason:'Check in second member'});
  check('tickets enforce time and single use, later members can check in');

  const expired=await fixture(2,100000); await payOwn(expired,'leader');
  await db.booking.update({where:{id:expired.b.id},data:{expiresAt:new Date(Date.now()-1000)}});
  await expireGroups(db); let e=await view(expired); assert.equal(e.status,'EXPIRED'); assert.equal(e.refunds.length,1); assert.equal(e.refunds[0].amount,50000);
  await expireGroups(db); assert.equal((await view(expired)).refunds.length,1);
  await action(expired,'staff',{action:'REFUND_DONE',refundId:e.refunds[0].id,reference:'TEST-REFUND-001',reason:'Test completed refund'});
  assert.equal((await view(expired)).paymentStatus,'REFUNDED');
  check('expiry creates actual-paid refund once, manual completion audited');

  const race=await fixture(2,100000); await action(race,'m2',{action:'JOIN',position:2});
  const before=await view(race,'m2'); const racev=await view(race);
  await Promise.allSettled([receiveSepayPayment(db,transfer(before.intents[0].code,50000),config),action(race,'leader',{action:'COVER',shareIds:racev.shares.map(s=>s.id)})]);
  let after=await view(race); assert.ok(after.received===0 || after.received===50000);
  if(after.received===0) await payOwn(race,'leader');
  else await payOwn(race,'leader');
  after=await view(race); assert.equal(after.received,100000);
  const over=await receiveSepayPayment(db,transfer(before.intents[0].code,50000),config); assert.ok(over.result.startsWith('REVIEW_'));
  assert.equal((await view(race)).received,100000);
  check('concurrent coverage/member transfer never double allocates; late receipt held for review');
  const cashRace=await fixture(2,100000); await action(cashRace,'m2',{action:'JOIN',position:2});
  await action(cashRace,'leader',{action:'REQUEST_CASH_ALL'});
  const cr=await view(cashRace);
  await action(cashRace,'staff',{action:'APPROVE_CASH',shareIds:[cr.shares[0].id],reason:'Approve first only'});
  assert.equal((await view(cashRace)).status,'PENDING_PAYMENT');
  await action(cashRace,'staff',{action:'APPROVE_CASH',shareIds:[cr.shares[1].id],reason:'Approve remainder'});
  const bankIntent=(await view(cashRace,'m2')).intents[0];
  await Promise.allSettled([action(cashRace,'staff',{action:'COLLECT_CASH',shareIds:[cr.shares[1].id],reason:'Receive cash concurrently'}),receiveSepayPayment(db,transfer(bankIntent.code,bankIntent.amount),config)]);
  assert.equal((await view(cashRace)).received,50000);
  assert.equal(await db.payment.count({where:{bookingId:cashRace.b.id}}),1);
  check('partial approval cannot confirm whole group; cash versus bank race counts once');

  const background=await fixture(2,100000); await payOwn(background,'leader');
  await db.booking.update({where:{id:background.b.id},data:{expiresAt:new Date(0)}});
  const functionSql=fs.readFileSync('prisma/patches/group-payment-expiry.sql','utf8').match(/CREATE OR REPLACE FUNCTION[\s\S]+?\$\$;/)[0].replaceAll('smashbook_private',schema).replaceAll('public.',schema+'.').replace('search_path = public','search_path = '+schema);
  await db.$executeRawUnsafe(functionSql);
  const count=await db.$queryRawUnsafe(`SELECT "${schema}".expire_group_bookings() AS count`);
  assert.equal(count[0].count,1);
  assert.equal((await db.booking.findUnique({where:{id:background.b.id}})).status,'EXPIRED');
  assert.equal((await db.groupRefund.findFirst({where:{payment:{bookingId:background.b.id}}})).amount,50000);
  check('database background expiry releases slots and creates refund without any page request');
  console.log('All PostgreSQL group integration checks passed.');
}
main().catch(e=>{ console.error('Group test failed:',e.message?.replace(/postgres(?:ql)?:\/\/[^\s]+/g,'[database URL redacted]')); process.exitCode=1; }).finally(async()=>{
  if(created) { await db.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`); console.log('Removed isolated test schema.'); }
  await db.$disconnect();
});
