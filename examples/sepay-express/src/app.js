import express from 'express';
import { authenticateWebhook } from './middleware/payment-auth.js';
import { createPaymentController } from './controllers/payment.controller.js';
import { createMockDb } from './db/mock.db.js';
import { createVietQrUrl } from './utils/qr.util.js';

export function createApp(config, db = createMockDb()) {
  const app = express();
  app.disable('x-powered-by');

  // PHẢI đăng ký webhook trước express.json() để giữ bytes gốc cho HMAC.
  app.post('/api/payment/webhook',
    express.raw({ type: 'application/json', limit: '64kb', inflate: false }),
    authenticateWebhook(config.auth), createPaymentController(db, config.bank));

  app.use(express.json({ limit: '16kb' }));
  app.post('/api/bookings', (req, res, next) => {
    try {
      const booking = db.createBooking(req.body?.slotId);
      res.status(201).json({
        ...booking, qrUrl: createVietQrUrl(booking.totalAmount, booking.code, config.bank),
      });
    } catch (error) { next(error); }
  });

  app.get('/api/bookings/:code', (req, res) => {
    res.set('Cache-Control', 'no-store');
    const booking = db.findBooking(req.params.code);
    // Token ngẫu nhiên giúp không đọc được đơn khác chỉ bằng cách đoán mã.
    // Production: dùng session đăng nhập và kiểm tra booking.userId.
    if (!booking || req.get('x-booking-token') !== booking.readToken) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking' });
    }
    const { readToken, ...publicBooking } = booking;
    return res.json(publicBooking);
  });

  app.use((req, res) => res.status(404).json({ success: false, message: 'Not found' }));
  app.use((error, req, res, next) => {
    const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
      ? error.status : 500;
    // Không log header, secret hoặc toàn bộ payload chứa dữ liệu ngân hàng.
    if (status === 500) console.error('Payment server: internal error; request not acknowledged');
    res.status(status).json({ success: false, message: status === 500 ? 'Internal server error' : error.message });
  });
  return app;
}
