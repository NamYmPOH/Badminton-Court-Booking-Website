// Chạy sau npm run build. Chỉ dùng secret giả và DB không tồn tại để kiểm tra lỗi an toàn.
const { spawn } = require('node:child_process');
const { createHmac } = require('node:crypto');
const assert = require('node:assert/strict');
const path = require('node:path');
const port = 34127;
const secret = 'local-http-test-secret-never-use-for-real-payments';
const server = spawn(process.execPath, [path.resolve('node_modules/next/dist/bin/next'), 'start', '-p', String(port), '-H', '127.0.0.1'], {
  windowsHide: true, stdio: 'ignore', env: { ...process.env,
    NODE_ENV: 'production', DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test?connect_timeout=1',
    AUTH_SECRET: 'local-http-auth-secret-never-use-in-production',
    SEPAY_AUTH_MODE: 'hmac', SEPAY_WEBHOOK_SECRET: secret,
    BANK_BIN: '970415', BANK_ACCOUNT_NO: '0001234703', BANK_ACCOUNT_NAME: 'TEST ACCOUNT', SEPAY_BANK_GATEWAY: 'VietinBank', SEPAY_SUB_ACCOUNT: '',
  },
});
async function main() {
  try {
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let i = 0; i < 60; i++) {
      if (server.exitCode !== null) throw new Error('Local test server exited');
      try { await fetch(base + '/api/payment/webhook'); ready = true; break; } catch { await new Promise(resolve => setTimeout(resolve, 250)); }
    }
    assert.ok(ready, 'local server ready');
    assert.equal((await fetch(base + '/api/payment/webhook')).status, 405);
    assert.equal((await fetch(base + '/api/bookings')).status, 401);
    assert.equal((await fetch(base + '/api/admin?tab=overview')).status, 401);
    assert.equal((await fetch(base + '/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
    assert.equal((await fetch(base + '/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' }, body: '{}' })).status, 403);
    assert.equal((await fetch(base + '/api/venue-registration', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
    const adminPage = await fetch(base + '/admin', { redirect: 'manual' });
    assert.equal(adminPage.status, 307);
    assert.equal(new URL(adminPage.headers.get('location'), base).pathname, '/login');
    const send = (body, valid) => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const headers = { 'Content-Type': 'application/json' };
      if (valid) {
        headers['X-SePay-Timestamp'] = timestamp;
        headers['X-SePay-Signature'] = 'sha256=' + createHmac('sha256', secret).update(timestamp + '.' + body).digest('hex');
      }
      return fetch(base + '/api/payment/webhook', { method: 'POST', headers, body });
    };
    assert.equal((await send('{}', false)).status, 401);
    assert.equal((await send('{', true)).status, 400);
    assert.equal((await send('{}', true)).status, 400);
    const response = await send(JSON.stringify({ id: 1, gateway: 'VietinBank', accountNumber: '0001234703', transferType: 'in', transferAmount: 150000, content: 'DATSAN1234567890' }), true);
    assert.equal(response.status, 500);
    assert.equal((await response.json()).success, false);
    console.log('HTTP smoke passed: admin and registration require login; cross-origin admin blocked; admin page redirects; webhook rejects invalid HMAC/JSON and DB failure without ACK.');
  } finally { server.kill(); }
}
main().catch(() => { console.error('HTTP smoke failed'); process.exitCode = 1; });
