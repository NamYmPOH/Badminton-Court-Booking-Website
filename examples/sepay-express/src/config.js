// Node nạp .env qua --env-file; không đưa các biến này vào frontend.
export function loadConfig(env = process.env) {
  const required = (name) => {
    const value = env[name]?.trim();
    if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
    return value;
  };

  // Mock DB mất dữ liệu khi restart, không được chạy cho thanh toán thật.
  if (env.NODE_ENV === 'production') {
    throw new Error('Cần thay Mock DB bằng DB bền vững trước khi chạy production.');
  }
  const mode = env.SEPAY_AUTH_MODE || 'hmac';
  if (!['hmac', 'apikey'].includes(mode)) throw new Error('SEPAY_AUTH_MODE không hợp lệ');
  const secret = required(mode === 'hmac' ? 'SEPAY_WEBHOOK_SECRET' : 'SEPAY_WEBHOOK_API_KEY');
  const port = Number(env.PORT || 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT không hợp lệ');
  const bin = required('BANK_BIN');
  const accountNo = required('BANK_ACCOUNT_NO');
  if (!/^\d{6}$/.test(bin)) throw new Error('BANK_BIN phải gồm 6 chữ số');
  if (!/^\d{6,19}$/.test(accountNo)) throw new Error('BANK_ACCOUNT_NO phải gồm 6–19 chữ số');

  return Object.freeze({
    host: env.HOST || '127.0.0.1', port,
    unitName: env.SEPAY_UNIT_NAME || '', unitCode: env.SEPAY_UNIT_CODE || '',
    auth: { mode, secret, toleranceSeconds: 300 },
    bank: {
      bin, accountNo, accountName: required('BANK_ACCOUNT_NAME'),
      gateway: required('SEPAY_BANK_GATEWAY'), subAccount: env.SEPAY_SUB_ACCOUNT || '',
    },
  });
}
