// A local trial using an isolated schema and fake bank details, never production orders.
const fs = require('node:fs');
const { spawn, execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const ts = require('typescript');
const bcrypt = require('bcryptjs');
require('@next/env').loadEnvConfig(process.cwd());
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { PrismaClient } = require('@prisma/client');
const { runtimeDatabaseUrl } = require('../src/lib/database-url.ts');
const schema = 'group_trial_' + crypto.randomBytes(6).toString('hex');
const url = new URL(runtimeDatabaseUrl(process.env.DATABASE_URL));
url.searchParams.set('schema', schema);
url.searchParams.set('connection_limit', '3');
const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
let created = false, child, stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  if (child && child.exitCode === null) child.kill();
  if (created && /^group_trial_[a-f0-9]{12}$/.test(schema)) {
    await db.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
    console.log('Removed isolated trial schema.');
  }
  await db.$disconnect();
}
async function main() {
  await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`); created = true;
  const sql = execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], { encoding: 'utf8' });
  if (/"public"\./.test(sql)) throw new Error('Trial schema must not target public');
  await db.$transaction(async tx => {
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
    for (const statement of sql.split(';').map(s=>s.trim()).filter(Boolean)) await tx.$executeRawUnsafe(statement);
  }, { timeout: 120000 });
  const passwordHash = await bcrypt.hash('GroupTrial123!', 10);
  for (const [id,name,role] of [['leader','Trưởng nhóm thử nghiệm','CUSTOMER'],['member','Thành viên thử nghiệm','CUSTOMER'],['owner','Nhân viên sân thử nghiệm','OWNER']]) await db.user.create({ data: { id, name, role, email: `${id}@example.test`, passwordHash } });
  await db.venue.create({ data: { id:'trial-venue',slug:'group-trial',name:'Sân thử chia tiền — không chuyển tiền thật',address:'Dữ liệu thử độc lập',district:'Thử nghiệm',lat:21,lng:105,phone:'0000000000',ownerId:'owner',status:'ACTIVE',images:[],amenities:[],courts:{create:{id:'trial-court',name:'Sân 1'}} } });
  await db.pricingRule.create({ data: { venueId: 'trial-venue', label: 'Giá thử nghiệm', daysOfWeek: [1,2,3,4,5,6,7], startMin: 300, endMin: 1320, walkInPrice: 150000, fixedPrice: 150000 } });
  const date = new Date(Date.now()+86400000); date.setUTCHours(0,0,0,0);
  await db.booking.create({ data: { code:'DATSAN9988776655',userId:'leader',venueId:'trial-venue',customerName:'Trưởng nhóm thử nghiệm',customerPhone:'0000000000',subtotal:150000,total:150000,status:'PENDING_PAYMENT',paymentStatus:'PENDING',paymentMethod:'BANK_TRANSFER',expiresAt:new Date(Date.now()+600000),items:{create:{courtId:'trial-court',date,startMin:600,endMin:660,price:150000}} } });
  if (process.argv.includes('--prepare-preview')) {
    const values = { DATABASE_URL: url.toString(), DIRECT_URL: url.toString(), AUTH_SECRET: crypto.randomBytes(32).toString('hex'), SEPAY_AUTH_MODE: 'hmac', SEPAY_WEBHOOK_SECRET: crypto.randomBytes(32).toString('hex'), BANK_BIN: '970415', BANK_ACCOUNT_NO: '000000000000', BANK_ACCOUNT_NAME: 'TEST ONLY DO NOT PAY', SEPAY_BANK_GATEWAY: 'VietinBank', SEPAY_SUB_ACCOUNT: '' };
    fs.writeFileSync('.env.group-preview.json', JSON.stringify({ schema, values }), { mode: 0o600 });
    created = false; // Persist this isolated fixture for the deployed branch trial.
    await db.$disconnect();
    console.log('Prepared isolated preview fixture; configuration saved in gitignored .env.group-preview.json.');
    return;
  }
  child = spawn(process.execPath, ['node_modules/next/dist/bin/next','start','-p','3102'], { stdio:'inherit', env:{...process.env,DATABASE_URL:url.toString(),DIRECT_URL:url.toString(),AUTH_SECRET:crypto.randomBytes(32).toString('hex'),SEPAY_AUTH_MODE:'hmac',SEPAY_WEBHOOK_SECRET:'isolated-trial-secret-not-production',BANK_BIN:'970415',BANK_ACCOUNT_NO:'000000000000',BANK_ACCOUNT_NAME:'TEST ONLY DO NOT PAY',SEPAY_BANK_GATEWAY:'VietinBank',SEPAY_SUB_ACCOUNT:''} });
  child.on('exit',()=>void stop());
  console.log('Trial: http://localhost:3102/login');
  console.log('Accounts: leader@example.test, member@example.test, owner@example.test; trial-only password: GroupTrial123!');
  console.log('Booking: http://localhost:3102/payment/result?booking=DATSAN9988776655');
}
process.on('SIGINT',()=>void stop()); process.on('SIGTERM',()=>void stop());
main().catch(async e=>{ console.error('Trial setup failed:', e.code || e.name, String(e.meta?.message || e.message).replace(/postgres(?:ql)?:\/\/[^\s]+/g, '[database URL redacted]')); await stop(); process.exitCode=1; });
