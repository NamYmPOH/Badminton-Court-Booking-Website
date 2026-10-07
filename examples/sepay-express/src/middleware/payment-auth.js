import { createHmac, timingSafeEqual } from 'node:crypto';

function equalSecret(actual, expected) {
  const a = Buffer.from(actual, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

export function authenticateWebhook(auth) {
  return (req, res, next) => {
    try {
      if (!Buffer.isBuffer(req.body)) {
        return res.status(415).json({ success: false, message: 'Yêu cầu body JSON' });
      }
      let valid = false;
      // Chỉ chấp nhận phương thức đã chọn, không fallback từ HMAC sang API Key.
      if (auth.mode === 'apikey') {
        const match = /^Apikey (\S+)$/i.exec(req.get('authorization') || '');
        valid = !!match && equalSecret(match[1], auth.secret);
      } else if (auth.mode === 'hmac') {
        const timestamp = req.get('x-sepay-timestamp') || '';
        const signature = req.get('x-sepay-signature') || '';
        const seconds = Number(timestamp);
        const fresh = /^\d{1,12}$/.test(timestamp) && Number.isSafeInteger(seconds)
          && Math.abs(Math.floor(Date.now() / 1000) - seconds) <= auth.toleranceSeconds;
        if (fresh && /^sha256=[a-f0-9]{64}$/.test(signature)) {
          // Ký đúng timestamp + dấu chấm + bytes body gốc, không JSON.stringify lại.
          const expected = 'sha256=' + createHmac('sha256', auth.secret)
            .update(timestamp + '.').update(req.body).digest('hex');
          valid = equalSecret(signature, expected);
        }
      }
      if (!valid) return res.status(401).json({ success: false, message: 'Unauthorized' });
      next();
    } catch (error) {
      next(error);
    }
  };
}
