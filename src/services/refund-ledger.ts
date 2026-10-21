/** Tổng thực thu và nghĩa vụ hoàn cũ/mới; không coi bút toán hoàn HLV là tiền khách nộp. */
export function refundLedger(payments: { amount: number; status: string; txnRef?: string; groupRefund?: { amount: number; status: string } | null }[], requests: { amount: number; status: string; id?: string }[], excludeId?: string) {
  let received = 0, legacyCommitted = 0, legacyCompleted = 0;
  for (const p of payments) {
    if (p.txnRef?.startsWith("REFUND-COACH-")) {
      if (["REFUND_PENDING", "REFUNDED"].includes(p.status)) legacyCommitted += p.amount;
      if (p.status === "REFUNDED") legacyCompleted += p.amount;
      continue;
    }
    if (!["PAID", "REFUND_PENDING", "REFUNDED"].includes(p.status)) continue;
    received += p.amount;
    if (p.groupRefund && ["PENDING", "COMPLETED"].includes(p.groupRefund.status)) {
      legacyCommitted += p.groupRefund.amount;
      if (p.groupRefund.status === "COMPLETED") legacyCompleted += p.groupRefund.amount;
    } else if (p.status === "REFUNDED") {
      legacyCommitted += p.amount; legacyCompleted += p.amount;
    }
  }
  const current = requests.filter(r => !excludeId || r.id !== excludeId);
  const committed = legacyCommitted + current.filter(r => ["REQUESTED", "PROCESSING", "COMPLETED"].includes(r.status)).reduce((sum,r) => sum+r.amount,0);
  const completed = legacyCompleted + current.filter(r => r.status === "COMPLETED").reduce((sum,r) => sum+r.amount,0);
  return { received, committed, completed, available: Math.max(0, received-committed) };
}
