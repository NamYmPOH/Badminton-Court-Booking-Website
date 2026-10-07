import { receivePayment } from '../services/payment.service.js';

export function createPaymentController(db, bank) {
  return async (req, res, next) => {
    try {
      // Middleware đã xác thực raw body. Bây giờ mới parse JSON.
      let body;
      try {
        body = JSON.parse(req.body.toString('utf8'));
      } catch {
        return res.status(400).json({ success: false, message: 'JSON không hợp lệ' });
      }
      const outcome = await receivePayment(body, db, bank);
      // ACK chỉ sau khi đã xử lý/lưu kết quả; ACK không có nghĩa booking luôn PAID.
      return res.status(200).json({ success: true, ...outcome });
    } catch (error) {
      // Nếu DB lỗi, trả 500 để SePay retry; tuyệt đối không ACK giả thành công.
      next(error);
    }
  };
}
