export interface PaymentOrder {
  bookingId: string;
  bookingCode: string;
  amount: number;
  customerName: string;
  customerPhone?: string;
  description?: string;
  returnUrl?: string;
}

export interface PaymentSessionResult {
  provider: string;
  txnRef: string;
  checkoutUrl?: string;
  qrUrl?: string;
  bankInfo?: {
    bankName: string;
    accountNo: string;
    accountName: string;
  };
}

export interface WebhookVerifyResult {
  success: boolean;
  bookingCode?: string;
  transactionNo?: string;
  transferAmount?: number;
  errorMessage?: string;
  rawPayload?: unknown;
}

export interface RefundParams {
  bookingId: string;
  bookingCode: string;
  paymentId?: string;
  amount: number;
  reason: string;
  bankAccount?: {
    accountNo: string;
    accountName: string;
    bankName: string;
  };
}

export interface GatewayRefundResult {
  success: boolean;
  status: "COMPLETED" | "MANUAL_REQUIRED" | "FAILED";
  refundId?: string;
  message: string;
}

export interface PaymentGateway {
  readonly provider: string;
  createPaymentSession(order: PaymentOrder): Promise<PaymentSessionResult>;
  verifyWebhook(
    payload: Buffer | string | unknown,
    headers: Record<string, string | undefined>
  ): Promise<WebhookVerifyResult>;
  supportsRefund(): boolean;
  processRefund(params: RefundParams): Promise<GatewayRefundResult>;
}
