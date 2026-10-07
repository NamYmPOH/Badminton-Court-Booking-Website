import { randomBytes } from 'node:crypto';

// CHỈ DÙNG LOCAL: Map không bền vững, không dùng chung giữa nhiều process.
export function createMockDb() {
  const bookings = new Map();
  const receipts = new Map();
  const slots = new Map([
    ['COURT1-1800', { totalAmount: 150000 }],
    ['COURT1-1900', { totalAmount: 180000 }],
  ]);
  let nextId = 123;
  return {
    createBooking(slotId) {
      const slot = slots.get(slotId);
      if (!slot) throw Object.assign(new Error('Khung giờ không tồn tại'), { status: 400 });
      if ([...bookings.values()].some((b) => b.slotId === slotId && ['PENDING', 'PAID'].includes(b.status))) {
        throw Object.assign(new Error('Khung giờ đã được giữ hoặc đặt'), { status: 409 });
      }
      // Giá do server quyết định, không lấy totalAmount từ request của khách.
      const code = `DATSAN${nextId++}`;
      const booking = {
        code, slotId, totalAmount: slot.totalAmount, status: 'PENDING',
        readToken: randomBytes(32).toString('hex'), paidAt: null, sepayTransactionId: null,
      };
      bookings.set(code, booking);
      return { ...booking };
    },
    findBooking(code) {
      const booking = bookings.get(code);
      return booking ? { ...booking } : null;
    },
    processPayment(event, bank, code) {
      // Toàn bộ đoạn này đồng bộ, không await: chỉ nguyên tử trong MỘT process demo.
      // DB thật phải dùng transaction + UNIQUE(sepayTransactionId) + cập nhật có điều kiện.
      const oldReceipt = receipts.get(event.id);
      const fingerprint = JSON.stringify([
        event.accountNumber, event.gateway, event.subAccount || '',
        event.transferType, event.transferAmount, event.content,
      ]);
      if (oldReceipt) {
        if (oldReceipt.fingerprint !== fingerprint) {
          throw Object.assign(new Error('Transaction ID trùng nhưng dữ liệu khác'), { status: 409 });
        }
        return { result: 'DUPLICATE', originalResult: oldReceipt.result };
      }

      let result;
      let booking;
      if (event.transferType !== 'in') result = 'IGNORED_OUTGOING';
      else if (event.accountNumber !== bank.accountNo || event.gateway !== bank.gateway
        || (bank.subAccount && event.subAccount !== bank.subAccount)) result = 'REVIEW_WRONG_ACCOUNT';
      else if (!code) result = 'REVIEW_BOOKING_CODE';
      else {
        booking = bookings.get(code);
        if (!booking) result = 'REVIEW_BOOKING_NOT_FOUND';
        else if (booking.status !== 'PENDING') result = 'REVIEW_BOOKING_NOT_PENDING';
        else if (event.transferAmount !== booking.totalAmount) result = 'REVIEW_AMOUNT_MISMATCH';
        else result = 'PAID';
      }

      if (result === 'PAID') {
        booking.status = 'PAID';
        booking.paidAt = new Date().toISOString();
        booking.sepayTransactionId = event.id;
      }
      // Lưu cả trường hợp cần đối soát trước khi ACK; không tự cộng tiền thiếu/thừa.
      receipts.set(event.id, { fingerprint, result, bookingCode: code, event: { ...event } });
      return { result };
    },
  };
}
