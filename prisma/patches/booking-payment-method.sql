-- Additive change; null preserves the interpretation of existing reservations.
ALTER TABLE public."Booking" ADD COLUMN IF NOT EXISTS "paymentMethod" public."PaymentProvider";
