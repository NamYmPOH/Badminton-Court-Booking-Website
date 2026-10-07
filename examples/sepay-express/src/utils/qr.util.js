export function createVietQrUrl(amount, bookingCode, bank) {
  // Tiền VND dùng số nguyên; giá phải lấy từ booking do server tạo.
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Số tiền không hợp lệ');
  if (!/^DATSAN\d{1,10}$/.test(bookingCode)) throw new Error('Mã booking không hợp lệ');
  const url = new URL(`https://img.vietqr.io/image/${bank.bin}-${bank.accountNo}-compact2.png`);
  // URLSearchParams tự encode khoảng trắng và ký tự đặc biệt.
  url.search = new URLSearchParams({
    amount: String(amount), addInfo: bookingCode, accountName: bank.accountName,
  }).toString();
  return url.toString();
}
