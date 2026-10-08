# QR and cash payment choices

New reservations default to BANK_TRANSFER with a maximum ten-minute hold, regardless of the legacy venue payment policy. The result page displays the VietQR image, configured bank account and booking code, alongside a cash button. Bank details come from the existing server SePay configuration; no client-provided amount or account is accepted.

Customers can switch their own live unpaid bookings between CASH and BANK_TRANSFER. Switching never confirms the booking, marks it paid, or extends its hold. Cash requests must be approved before the original hold expires. Approval confirms the slots and clears the deadline without creating a payment. A separate audited CASH_PAID action records money actually received.

The `/venue-operations` page is linked from the account menu for ADMIN, OWNER and STAFF. Owners can access only venues they own; staff require an existing VenueStaff assignment. Read queries are scoped and write permissions are re-read inside Serializable transactions. This feature does not automatically assign staff or grant roles.

Apply `prisma/patches/booking-payment-method.sql` before deploying. The nullable field preserves legacy orders. Existing confirmed unpaid reservations can display a QR until play starts. Valid incoming bank transfers are reconciled even after a cash selection/approval; if cash was already collected, the bank transfer is recorded for manual review rather than paid twice.

Missing SePay configuration does not prevent creating or viewing a cash request. The UI explicitly reports online payment unavailable and never fabricates a QR. Full SePay configuration remains required for online payment.

Verification: 67 automated tests; production build, TypeScript and lint; browser verification with `node scripts/preview-payment-fixture.cjs` using synthetic responses only. Verified QR default, cash selection, manual approval, collection and paid result. The fixture never writes bookings or payments to Supabase. Real banking settlement and PostgreSQL concurrency under load are not covered by the browser fixture.
