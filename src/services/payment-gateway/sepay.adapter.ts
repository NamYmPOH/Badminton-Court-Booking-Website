import {
  PaymentGateway,
  PaymentOrder,
  PaymentSessionResult,
  WebhookVerifyResult,
  RefundParams,
  GatewayRefundResult,
} from "./gateway.interface";
import {
  getSepayConfig,
  createVietQrUrl,
  verifySepaySignature,
  parseSepayEvent,
  extractBookingCode,
} from "../../lib/sepay";

export class SepayGatewayAdapter implements PaymentGateway {
  readonly provider = "BANK_TRANSFER";

  async createPaymentSession(order: PaymentOrder): Promise<PaymentSessionResult> {
    const config = getSepayConfig();
    const qrUrl = createVietQrUrl(order.amount, order.bookingCode, config);

    return {
      provider: this.provider,
      txnRef: `SEPAY-${order.bookingCode}`,
      qrUrl,
      bankInfo: {
        bankName: config.SEPAY_BANK_GATEWAY,
        accountNo: config.BANK_ACCOUNT_NO,
        accountName: config.BANK_ACCOUNT_NAME,
      },
    };
  }

  async verifyWebhook(
    payload: Buffer | string | unknown,
    headers: Record<string, string | undefined>
  ): Promise<WebhookVerifyResult> {
    const config = getSepayConfig();
    const rawBuffer = Buffer.isBuffer(payload)
      ? payload
      : typeof payload === "string"
      ? Buffer.from(payload, "utf8")
      : Buffer.from(JSON.stringify(payload), "utf8");

    // Tạo Headers-like object cho verifySepaySignature
    const headerMap = new Headers();
    for (const [key, val] of Object.entries(headers)) {
      if (val) headerMap.set(key, val);
    }

    const isValid = verifySepaySignature(rawBuffer, headerMap, config.SEPAY_WEBHOOK_SECRET);
    if (!isValid) {
      return {
        success: false,
        errorMessage: "Chữ ký HMAC webhook không hợp lệ hoặc đã hết hạn.",
      };
    }

    try {
      const event = parseSepayEvent(rawBuffer);
      const bookingCode = extractBookingCode(event.content) ?? undefined;

      return {
        success: true,
        bookingCode,
        transactionNo: String(event.id),
        transferAmount: event.transferAmount,
        rawPayload: event,
      };
    } catch (err) {
      return {
        success: false,
        errorMessage: err instanceof Error ? err.message : "Lỗi giải mã payload SePay",
      };
    }
  }

  supportsRefund(): boolean {
    return false;
  }

  async processRefund(params: RefundParams): Promise<GatewayRefundResult> {
    return {
      success: false,
      status: "MANUAL_REQUIRED",
      message: `Cổng thanh toán SePay (Chuyển khoản trực tiếp) chưa hỗ trợ API hoàn tiền tự động trực tuyến. Yêu cầu hoàn ${params.amount.toLocaleString("vi-VN")}đ cho đơn ${params.bookingCode} phải được thực hiện qua quy trình hoàn thủ công có chứng từ ngân hàng.`,
    };
  }
}
