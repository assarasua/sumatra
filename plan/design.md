# Personal Agent Protocol design: Explore Sumatra Escape

Scope follows the user’s explicit requests for public agent tour search, customer-approved checkout links, WhatsApp contact and Poppy discovery. No account or security access is being added.

```json poppy-design
{"domain":"www.exploresumatraescape.com","milestones":["foundation","interfaces"],"interfaces":["mcp","openapi"],"sign_in":[],"extensions":[]}
```

Guest MCP and OpenAPI use no Session claims or identity, as PAP section 7 permits. Poppy discovery also points to the A2A 1.0 Agent Card service, using protocol type a2a; Poppy Conversations are not advertised. No OAuth, account scopes, signed-in access, browser-session join or delegation is offered. Signed headers grant no access and are not interpreted. Poppy-Version is checked if supplied. Checkout requires explicit customer consent, uses a UUID for idempotency, calculates prices on the server, and only returns a Stripe test checkout link. The customer completes payment. WhatsApp tools prepare links and never send messages. Private booking records and admin invoicing are excluded.

Supported MCP versions are 2025-06-18 and 2025-11-25 via the official SDK. A2A 1.0 JSON-RPC uses the official SDK. Browser Origin validation, request limits, and shared checkout rate limits apply. No agent header or customer payload is logged. Public documents and PDFs contain no credentials or customer information. Runtime credentials are stored as encrypted Cloudflare secrets.
