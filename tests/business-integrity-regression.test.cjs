const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const {createRequire}=require('node:module');
const {test}=require('node:test');
const assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const {refundLedger}=require('../src/services/refund-ledger.ts');
const {completeManualRefund,createRefundRequest}=require('../src/services/refund.service.ts');
const {generateSingleTicketSignature,checkInWithTicket,issueBookingTicket}=require('../src/services/ticket.service.ts');
const {slotPrice}=require('../src/lib/booking.ts');
const {startCourtSession,addCourtSurcharge}=require('../src/services/session.service.ts');
const {PaymentError}=require('../src/lib/sepay.ts');

function loadRoute(relative,db,overrides={}) {
  const filename=path.join(__dirname,'../src',relative),native=createRequire(filename);
  const mocks={
    '@/lib/db':{db},
    '@/lib/payment-session':{requirePaymentUser:async()=> 'actor'},
    '@/lib/admin-policy':{assertSameOrigin:()=>{}},
    '@/lib/sepay':{PaymentError,readPaymentBody:async r=>Buffer.from(await r.text()),paymentErrorResponse:e=>Response.json({message:e.message},{status:e.status||500})},
    ...overrides,
  };
  const module={exports:{}};
  const req=id=>id in mocks?mocks[id]:id.startsWith('@/')?native(path.join(__dirname,'../src',id.slice(2)+'.ts')):native(id);
  const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
  new Function('require','module','exports',code)(req,module,module.exports);
  return module.exports;
}
const request=body=>new Request('https://smashbook.test/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
function scopedDb(role='OWNER') {
  const checks=[];
  const deny={findFirst:async q=>{checks.push(q);return null;}};
  const tx={user:{findUnique:async()=>({id:'actor',role,status:'ACTIVE'})},refundRequest:deny,bookingItem:deny,courtSession:deny,courtSurcharge:deny};
  return {checks,db:{$transaction:async fn=>fn(tx)}};
}
for(const action of ['APPROVE','REJECT','COMPLETE_MANUAL'])test('Phân quyền hoàn tiền khác cơ sở: '+action,async()=>{
  const {db,checks}=scopedDb();const route=loadRoute('app/api/venue-operations/refunds/route.ts',db);
  const res=await route.POST(request({action,requestId:'other-venue-request',...(action==='REJECT'?{reason:'Từ chối'}:{}),...(action==='COMPLETE_MANUAL'?{bankRef:'BANK-001'}:{})}));
  assert.equal(res.status,403);assert.deepEqual(checks[0].where.booking.venue,{ownerId:'actor'});
});
for(const body of [
  {action:'START_SESSION',bookingItemId:'other-item'},
  {action:'COMPLETE_SESSION',sessionId:'other-session'},
  {action:'ADD_SURCHARGE',sessionId:'other-session',requestId:'e025f188-ff9c-4ec0-8725-2396c844365a',type:'OTHER',amount:1000,reason:'Phụ thu'},
  {action:'PAY_SURCHARGE',surchargeId:'other-charge',paymentMethod:'CASH'},
])test('Phân quyền phiên sân khác cơ sở: '+body.action,async()=>{
  const {db,checks}=scopedDb('STAFF');const route=loadRoute('app/api/venue-operations/sessions/route.ts',db);
  assert.equal((await route.POST(request(body))).status,403);
  assert.ok(JSON.stringify(checks[0]).includes('"userId":"actor"'));
});
test('Quyền được đọc lại bên trong transaction trước mutation',async()=>{
  const tx={user:{findUnique:async()=>({id:'actor',role:'OWNER',status:'BLOCKED'})}};
  const route=loadRoute('app/api/venue-operations/refunds/route.ts',{$transaction:async fn=>fn(tx)});
  assert.equal((await route.POST(request({action:'APPROVE',requestId:'r'}))).status,403);
});
for(const status of ['REQUESTED','REJECTED','FAILED'])test('Không hoàn tất yêu cầu chưa duyệt: '+status,async()=>{
  let writes=0;const tx={refundRequest:{findUnique:async()=>({id:'r',status}),update:async()=>{writes++;}},refundTransaction:{create:async()=>{writes++;}}};
  await assert.rejects(completeManualRefund(tx,{requestId:'r',processedById:'actor',bankRef:'bank-ref'}),e=>e.status===409);
  assert.equal(writes,0);
});
test('Sổ hoàn không coi nghĩa vụ hoàn HLV là tiền khách nộp; tính cả GroupRefund',()=>{
  const ledger=refundLedger([
    {amount:500000,status:'PAID',txnRef:'PAY-1'},
    {amount:200000,status:'REFUND_PENDING',txnRef:'REFUND-COACH-x'},
    {amount:100000,status:'REFUND_PENDING',txnRef:'PAY-2',groupRefund:{amount:50000,status:'PENDING'}},
  ],[{amount:100000,status:'PROCESSING'}]);
  assert.equal(ledger.received,600000);assert.equal(ledger.available,250000);
});
test('Kiểm tra lại trần hoàn trước khi ghi giao dịch hoàn',async()=>{
  const tx={refundRequest:{findUnique:async()=>({id:'r',status:'PROCESSING',amount:200,booking:{payments:[{amount:250,status:'PAID'},{amount:100,status:'REFUND_PENDING',txnRef:'REFUND-COACH-x'}],refundRequests:[]}})}};
  await assert.rejects(completeManualRefund(tx,{requestId:'r',processedById:'actor',bankRef:'bank-ref'}),e=>e.status===409);
});
test('Chặn luồng mới tạo nghĩa vụ hoàn trùng với đơn nhóm',async()=>{
  const tx={booking:{findUnique:async()=>({id:'b',group:{id:'g'},payments:[],refundRequests:[]})}};
  await assert.rejects(createRefundRequest(tx,{bookingId:'b',amount:10,requestedById:'u',reason:'Hủy',type:'FULL_CANCELLATION'}),e=>e.status===409);
});
test('Thiếu khóa ký vé phải báo cấu hình lỗi',()=>{
  assert.throws(()=>generateSingleTicketSignature('t','n',''),e=>e.status===503);
});
for(const [status,paymentStatus] of [['CONFIRMED','REFUNDED'],['CONFIRMED','PENDING'],['COMPLETED','PAID'],['PENDING_PAYMENT','PAID']])test('Từ chối vé theo trạng thái đơn '+status+'/'+paymentStatus,async()=>{
  const old=process.env.AUTH_SECRET;process.env.AUTH_SECRET='x'.repeat(40);
  try {
    const ticket={id:'t',ticketNonce:'n',booking:{status,paymentStatus,venueId:'v'},validFrom:new Date(0),validTo:new Date('2099-01-01')};
    const tx={ticket:{findUnique:async()=>ticket}};
    await assert.rejects(checkInWithTicket(tx,{qrPayload:generateSingleTicketSignature('t','n'),operator:{id:'a',role:'ADMIN',status:'ACTIVE'}}),e=>e.status===409);
  }finally{if(old===undefined)delete process.env.AUTH_SECRET;else process.env.AUTH_SECRET=old;}
});
test('Không cấp vé mới để dùng lại đơn đã có vé đã quét',async()=>{
  const old=process.env.AUTH_SECRET;process.env.AUTH_SECRET='x'.repeat(40);
  try {
    const prior={id:'t',ticketNonce:'n',status:'CHECKED_IN'};
    const tx={booking:{findUnique:async()=>({id:'b',status:'CHECKED_IN',paymentStatus:'PAID',group:null})},ticket:{findFirst:async args=>{assert.deepEqual(args.where,{bookingId:'b'});return prior;}}};
    const result=await issueBookingTicket(tx,{bookingId:'b',holderName:'Test',holderPhone:'0900000000'});
    assert.equal(result.ticket,prior);
  }finally{if(old===undefined)delete process.env.AUTH_SECRET;else process.env.AUTH_SECRET=old;}
});
test('Giá riêng sân A không áp nhầm cho sân B khi thiếu giá chung',()=>{
  const venue={openMin:300,closeMin:1320,pricingRules:[{courtId:'A',daysOfWeek:[1,2,3,4,5,6,7],startMin:300,endMin:1320,walkInPrice:200000}]};
  assert.equal(slotPrice(venue,'2026-10-25',600,630,'B'),null);
  assert.equal(slotPrice(venue,'2026-10-25',600,630,'A'),100000);
});
test('Nhận sân từ HELD hoặc chưa trả tiền phải bị chặn',async()=>{
  const tx={courtSession:{findUnique:async()=>null},bookingItem:{findUnique:async()=>({status:'HELD',booking:{status:'PENDING_PAYMENT',paymentStatus:'PENDING'}})}};
  await assert.rejects(startCourtSession(tx,{bookingItemId:'bi',operatorId:'a'}),e=>e.status===409);
});
test('Gửi lại cùng request phụ thu không tạo khoản thu lần hai',async()=>{
  const previous={id:'s',sessionId:'session',amount:1000,type:'OTHER',reason:'Nước'};
  const tx={courtSurcharge:{findUnique:async()=>previous}};
  assert.equal(await addCourtSurcharge(tx,{requestId:'r',sessionId:'session',amount:1000,type:'OTHER',reason:'Nước',createdById:'a'}),previous);
  await assert.rejects(addCourtSurcharge(tx,{requestId:'r',sessionId:'session',amount:2000,type:'OTHER',reason:'Nước',createdById:'a'}),e=>e.status===409);
});
test('Lỗi sau ghi giao dịch hoàn rollback cả giao dịch và trạng thái (transaction giả lập)',async()=>{
  let stored=[];let transactions=0;
  const db={$transaction:async fn=>{
    transactions++;const before=structuredClone(stored);
    const tx={refundRequest:{findUnique:async()=>({id:'r',bookingId:'b',amount:100,status:'PROCESSING',booking:{payments:[{amount:100,status:'PAID'}],refundRequests:[]}}),update:async()=>{throw Error('Lỗi cập nhật');}},refundTransaction:{create:async data=>{stored.push(data);return data;}}};
    try{return await fn(tx);}catch(e){stored=before;throw e;}
  }};
  await assert.rejects(completeManualRefund(db,{requestId:'r',processedById:'a',bankRef:'ref-001'}),/Lỗi cập nhật/);
  assert.equal(transactions,1);assert.deepEqual(stored,[]);
});
test('Hủy hoàn toàn đơn giải phóng tài nguyên và vô hiệu vé trong cùng transaction',async()=>{
  const mutations=[];
  const booking={id:'b',userId:'actor',code:'CODE',status:'CONFIRMED',paymentStatus:'PAID',total:100,subtotal:100,discount:0,group:null,items:[{date:'2099-01-01',startMin:600}],payments:[{id:'p',amount:100,status:'PAID',txnRef:'paid'}],refundRequests:[]};
  const model=name=>({update:async args=>{mutations.push(name);return args;},updateMany:async args=>{mutations.push(name);return args;}});
  const tx={booking:{...model('booking'),findUnique:async()=>booking},refundRequest:{create:async args=>({id:'r',...args.data})},bookingItem:model('items'),coachBooking:model('coach'),offerUsage:model('offers'),ticket:model('tickets'),adminAudit:{create:async()=>{mutations.push('audit');}}};
  const route=loadRoute('app/api/bookings/[code]/refund-request/route.ts',{$transaction:async fn=>fn(tx)});
  const res=await route.POST(request({reason:'Không thể đến sân',bankAccountNumber:'12345678',bankAccountName:'Test User',bankName:'Test Bank'}),{params:{code:'CODE'}});
  assert.equal(res.status,201,JSON.stringify(await res.json()));
  assert.deepEqual(mutations,['booking','items','coach','offers','tickets','audit']);
});
