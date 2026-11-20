# Explore Sumatra Escape

Next.js website on Cloudflare Workers, built with OpenNext. Production: https://www.exploresumatraescape.com

The homepage, five booking pages and 15 journal articles in seven languages are prerendered. Photos are optimized WebP and fonts are self-hosted. Stripe Checkout handles card information; bookings and verified webhook events are stored in Cloudflare D1.

Five indexable tour pages, public AI reading files, MCP Streamable HTTP, an A2A 1.0 Agent Card, and Personal Agent Protocol 1.0 discovery expose the offered tours and booking policies. See `/agents`, `/mcp`, `/.well-known/agent-card.json`, `/.well-known/poppy.json`, `/openapi.json`, `/llms.txt`, and `/llms-full.txt`.

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

Cloudflare Workers Builds connects `assarasua/sumatra` main to `sumatra-nextjs`, with build command `npm run build:verified` and deploy command `npm run deploy`. The obsolete `sumatra` service's builds are disabled. A failed test or build stops publication. Preview builds are disabled so branch previews cannot use production payment/email bindings. Runtime secrets belong on `sumatra-nextjs`; they do not belong in the repository or build variables.

## Booking emails

After a signed Stripe webhook verifies a paid booking and its exact EUR amount, a D1 outbox schedules a branded Resend confirmation with WhatsApp details and the booked tour's PDF guide. Unpaid checkout completion does not email. The unique booking ID deduplicates all payment event types, and Resend's idempotency key protects delivery retries. The worker acknowledges webhooks before delivering and retries pending mail every five minutes. After 23 hours from the first uncertain attempt, it flags `needs_review` rather than risk duplicate mail beyond Resend's 24-hour idempotency window.

Configure `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and optional `RESEND_REPLY_TO` as Cloudflare runtime secrets. Verify the sender domain in Resend. Read `booking_emails` for delivery status (`sent`, `pending`, `needs_review`); avoid logging customer data. Static branded PDFs are committed under `public/guides`; regeneration uses `scripts/build-guides.py` and the website's Instrument fonts.

## Personal agent access

Public actions: `search_tours`, `get_tour`, `quote_tour`, `search_articles`, `get_whatsapp_link`, `create_checkout_link`. All use the same authoritative server pricing. Checkout requires literal `customer_consent: true`, a UUID `request_id` reused for retries, and valid customer data. It creates a Stripe test checkout link; the customer completes payment. WhatsApp is a link only. No private booking lookup, invoice administration, email sending, cancellation, account access, or automatic payment is exposed.

Poppy discovery advertises guest MCP/OpenAPI and the A2A agent. As permitted by PAP section 7, these stateless interfaces use no Poppy Session identity or continuity, so they accept but ignore Session claims. No OAuth, joined browser sessions, Poppy Conversations, Operations extension or signed-in delegation is advertised. MCP implements versions 2025-06-18 and 2025-11-25 using the official SDK. A2A uses the official 1.0 SDK and `SendMessage`, requiring `A2A-Version: 1.0`.

## Payments

Payments are currently TEST MODE. The server deliberately accepts test keys only. Live charging requires account activation and a reviewed switch to live keys and webhook configuration.

Confirmed per-person prices: 1 day €70; 2 days/1 night €120; 4 days €250; 5 days €320. Four- and five-day tours require two travellers. Three-day prices depend on group size: solo €250, two €180 each, three or four €160 each, five or six €150 each. Larger groups need a quote. Custom journeys have no public fixed price.

The booking page lets customers select traveller count and shows the total before redirecting to Stripe. Prices are calculated again on the server. Preferred departure dates require team confirmation after payment.

Webhook: `https://www.exploresumatraescape.com/api/stripe/webhook`

Events: checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed, checkout.session.expired, invoice.paid, invoice.payment_failed.

`POST /api/admin/invoices` uses a private admin bearer token and creates draft custom-tour invoices; it never automatically emails them. Automatic Stripe Tax remains disabled until tax registrations and the appropriate travel-service tax treatment are confirmed.
