# Explore Sumatra Escape

Next.js website on Cloudflare Workers, built with OpenNext. Production: https://www.exploresumatraescape.com

The homepage, five booking pages and 15 journal articles are prerendered. Photos are optimized WebP and fonts are self-hosted. Stripe Checkout handles card information; bookings and verified webhook events are stored in Cloudflare D1.

## Develop and deploy

Node.js 22 or newer:

```
npm ci
npm run dev
npm test
npm run build:cloudflare
npm run deploy
```

Cloudflare account and D1 bindings are in `wrangler.jsonc`. Apply new migrations with `npx wrangler d1 migrations apply sumatra-bookings --remote` before deployment. Configure server secrets with Wrangler; keep local development secrets in ignored `.dev.vars`.

## Payments

Payments are currently TEST MODE. The server deliberately accepts test keys only. Live charging requires account activation and a reviewed switch to live keys and webhook configuration.

Confirmed per-person prices: 1 day €70; 2 days/1 night €120; 4 days €250; 5 days €320. Four- and five-day tours require two travellers. Three-day prices depend on group size: solo €250, two €180 each, three or four €160 each, five or six €150 each. Larger groups need a quote. Custom journeys have no public fixed price.

The booking page lets customers select traveller count and shows the total before redirecting to Stripe. Prices are calculated again on the server. Preferred departure dates require team confirmation after payment.

Webhook: `https://www.exploresumatraescape.com/api/stripe/webhook`

Events: checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed, checkout.session.expired, invoice.paid, invoice.payment_failed.

`POST /api/admin/invoices` uses a private admin bearer token and creates draft custom-tour invoices; it never automatically emails them. Automatic Stripe Tax remains disabled until tax registrations and the appropriate travel-service tax treatment are confirmed.
