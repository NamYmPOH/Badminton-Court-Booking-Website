export function extractBookingCode(content) {
  // Nhóm 1 chứa phần số sau DATSAN. Không nhận mã nằm trong chuỗi chữ/số khác.
  const matches = [...content.matchAll(/(?<![A-Z0-9])DATSAN(\d{1,10})(?![A-Z0-9])/gi)];
  const codes = [...new Set(matches.map((match) => `DATSAN${match[1]}`))];
  // Có hai mã khác nhau thì chuyển đối soát, không tự chọn mã đầu tiên.
  return codes.length === 1 ? codes[0] : null;
}

export function validatePayload(body) {
  if (!body || Array.isArray(body) || typeof body !== 'object'
    || !Number.isSafeInteger(body.id) || body.id <= 0
    || typeof body.content !== 'string' || body.content.length > 10000
    || typeof body.accountNumber !== 'string' || !body.accountNumber
    || typeof body.gateway !== 'string' || !body.gateway
    || !['in', 'out'].includes(body.transferType)
    || !Number.isSafeInteger(body.transferAmount) || body.transferAmount <= 0
    || (body.subAccount != null && typeof body.subAccount !== 'string')) {
    const error = new Error('Payload webhook không hợp lệ');
    error.status = 400;
    throw error;
  }
  return body;
}

export function receivePayment(body, db, bank) {
  const event = validatePayload(body);
  return db.processPayment(event, bank, extractBookingCode(event.content));
}
