> Historical revision note from the input project. Current results and scope: `VERIFICATION.md` and `CLIENT-REQUIREMENTS-AUDIT.md`.

> These are the original v2.0 integration notes. Header, typography, listing and gallery behavior are superseded by `UI-REVISION-2.1.md`.

# Upgrade notes

## What remained

The Next.js/Vercel storefront is the base, including its brand tokens, editorial layout and existing product-photo library. This is not a re-export of the React/Vite frontend. Domain DTOs were brought over from the main frontend to align the API wire contract.

## What changed structurally

- Replaced static-export assumptions with dynamic Next.js App Router pages for backend catalog IDs and real orders.
- Added typed `src/api/*` adapters and server catalog data loading; retained thin route files and reusable views.
- Added explicit `api` versus `demo` environment modes. Live failures never swap to sample data.
- Replaced mock sign-in, account, pricing and ordering with the source's real Supabase/Express flow.
- Removed fake verification, simulated purchase receipts, static customer identity and nonexistent endpoint assumptions.
- Reworked the header into a persistent sticky component with shared hover region, delayed close, focus management and touch menu.
- Added defensive cart restoration, same-tab persistence, immutable measurement copies and idempotent retry handling.
- Updated checkout to COD discovery, source shipping amounts, server coupons/rewards and actual response totals.
- Added account CRUD, cancellation and order tracking with the source's authorization/UUID constraints.
- Added published/sanitized CMS content, noindex defaults and exact HTTPS image-host allowlist.
- Converted only the three supplied main-ZIP PNGs, retaining source asset metadata and a reusable conversion script.

## Source-to-new environment mapping

| Main React frontend | New Next storefront |
|---|---|
| `VITE_API_URL` | `NEXT_PUBLIC_API_URL` |
| `VITE_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| React local port 5173 | Next local port 3000; update `CORS_CUSTOMER_URL` |
| Vite browser routing | App Router page files |

Use the actual public key field in your supplied frontend environment if it has an alias. Secret/service-role keys must never cross to the public client.

## Deliberately not changed

No SQL or Prisma database migration. No Express backend rewrite. No admin-panel rewrite. No changes to the existing Netlify/Vercel deployments. No payment provider or marketing delivery service was activated.

The package lock from the previous application was not retained after dependency changes. Generate a fresh one with an actual successful npm resolution; do not use a stale lock to imply the build was tested.
