# Booking and checkout verification — 2026-10-06

## Original deployment

Reproduced on https://badminton-court-booking-website-five.vercel.app/:
- The calendar called 2026-10-05 “today” on 2026-10-06.
- Selecting 17:00–18:00 cost 90,000 VND instead of the catalogue's weekday walk-in price of 110,000 VND.
- Checkout displayed 18:00–19:30 regardless of selection.
- Source inspection also found a static hold timer, unrestricted payment methods, URL-controlled totals, fabricated success/QR details and no payment API.

## Changes and verification

- Calendar uses Vietnam time, seven rolling dates, all active courts and actual opening hours. Unpriced or past slots are disabled.
- Changing date clears selection. Mixed-court, duplicate and nonconsecutive slots cannot proceed.
- Catalogue pricing and canonical court/venue names are reconstructed in checkout. Missing, malformed, expired or forged selection data is rejected.
- Checkout and result use the selected date, court and time range. Voucher input resets the old discount; discounts cannot exceed the subtotal.
- Contact validation rejects blank names and invalid Vietnamese mobile numbers. Payment method follows the venue policy.
- The flow is explicitly a demo; it does not claim a payment, reservation, QR check-in or hold has occurred. Results persist only in session storage and contain no entered contact details.
- The mobile booking summary sits above bottom navigation.

Commands passed: `npm test` (15 tests), `npm run lint`, `npm run build` (includes TypeScript checks).

Browser checks on the production build: weekday 17:00–18:00 = 110,000 VND; Saturday = 100,000 VND; date switch clears selection; gapped selection disabled; CHAOBAN10 = 99,000 VND; invalid voucher clears prior discount; invalid telephone rejected; demo result preserves details and survives reload. No browser console errors recorded during this flow.

HTTP smoke checks returned 200 for home, venues, map view, venue detail, booking grid, checkout, result, login, register, bookings, account and notifications. These checks establish page availability, not backend functionality.

## Remaining limitations

This repository is a frontend demo. Availability, accounts, existing booking history and map functionality still contain mock implementations. No database-backed hold, real reservation or payment gateway transaction has been implemented or verified. Client validation is not a substitute for server-side validation when that backend is added. Missing price rules remain unavailable rather than guessing prices.
