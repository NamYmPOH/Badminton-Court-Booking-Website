// Postman: Scripts > Pre-request. Chỉ dùng biến local, không chia sẻ secret.
// Dùng chính chuỗi sẽ gửi để ký; không parse/stringify lại JSON.
const secret = pm.environment.get('sepayWebhookSecret');
if (!secret) throw new Error('Chưa cấu hình sepayWebhookSecret trong Postman Environment');
const rawBody = pm.variables.replaceIn(pm.request.body.raw);
pm.request.body.update(rawBody);
const timestamp = String(Math.floor(Date.now() / 1000));
const encoder = new TextEncoder();
const key = await crypto.subtle.importKey(
  'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
);
const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${rawBody}`));
const hex = Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
pm.request.headers.upsert({ key: 'Content-Type', value: 'application/json' });
pm.request.headers.upsert({ key: 'X-SePay-Timestamp', value: timestamp });
pm.request.headers.upsert({ key: 'X-SePay-Signature', value: `sha256=${hex}` });
