// Local browser verification only. Synthetic data, no database or bank writes.
const http = require('node:http');
const { spawn } = require('node:child_process');
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3100'], { stdio: 'inherit' });
const booking = { id: 'fixture', code: 'DATSAN1234567890', venueName: 'Sân kiểm thử giao diện', venueAddress: 'Dữ liệu mô phỏng — không chuyển tiền', status: 'PENDING_PAYMENT', paymentStatus: 'PENDING', paymentMethod: 'BANK_TRANSFER', total: 150000, expiresAt: new Date(Date.now() + 600000).toISOString(), canChoosePayment: true,
  items: [{ id: 'i', courtName: 'Sân 1', date: '2026-10-09', startMin: 1080, endMin: 1140 }],
  qrUrl: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360"><rect width="360" height="360" fill="white"/><text x="180" y="180" text-anchor="middle" fill="black">QR TEST — KHÔNG THANH TOÁN</text></svg>'),
  bank: { name: 'Ngân hàng kiểm thử', accountNo: '0000000000', accountName: 'TAI KHOAN KIEM THU' } };
const server = http.createServer(async (req, res) => {
  const json = data => { res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(data)); };
  if (req.url.startsWith('/api/auth/me')) return json({ ok: true, data: { user: { id: 'owner', name: 'Chủ sân kiểm thử', role: 'OWNER', status: 'ACTIVE' } } });
  if (req.url.startsWith('/api/bookings/')) {
    if (req.method === 'PATCH') { let raw = ''; for await (const part of req) raw += part; booking.paymentMethod = JSON.parse(raw).method === 'CASH' ? 'AT_VENUE' : 'BANK_TRANSFER'; }
    return json({ success: true, booking });
  }
  if (req.url.startsWith('/api/venue-operations')) {
    if (req.method === 'POST') { let raw = ''; for await (const part of req) raw += part; const { action } = JSON.parse(raw); if (action === 'CONFIRM') { booking.status = 'CONFIRMED'; booking.expiresAt = ''; } if (action === 'CASH_PAID') { booking.paymentStatus = 'PAID'; booking.canChoosePayment = false; } return json({ success: true }); }
    return json({ bookings: [{ ...booking, paymentMethod: booking.paymentMethod === 'AT_VENUE' ? 'CASH' : 'BANK_TRANSFER', customerName: 'Khách kiểm thử', customerPhone: '0000000000', venue: { name: booking.venueName, paymentMode: 'AT_VENUE' }, items: booking.items.map(i => ({ ...i, court: { name: i.courtName } })) }] });
  }
  const proxy = http.request({ hostname: '127.0.0.1', port: 3100, path: req.url, method: req.method, headers: req.headers }, upstream => { res.writeHead(upstream.statusCode, upstream.headers); upstream.pipe(res); });
  proxy.on('error', () => { res.writeHead(502); res.end('Next server starting'); }); req.pipe(proxy);
});
server.listen(3101, '127.0.0.1', () => console.log('Fixture UI: http://127.0.0.1:3101/payment/result?booking=DATSAN1234567890'));
function stop() { child.kill(); server.close(); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);
