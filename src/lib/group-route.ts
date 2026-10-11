import { getSepayConfig, PaymentError, readPaymentBody } from "./sepay";

export function groupConfig() {
  try {
    return getSepayConfig();
  } catch (error) {
    if (!(error instanceof PaymentError) || error.status !== 503) throw error;
  }
}
export async function groupBody(request: Request) {
  const raw = await readPaymentBody(request, 8192);
  try {
    return JSON.parse(raw.toString("utf8")) as unknown;
  } catch {
    throw new PaymentError(400, "JSON không hợp lệ.");
  }
}
