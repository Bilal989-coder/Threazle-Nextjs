# Threazle storefront — audited update v2.3

**Latest base:** your `threazle-storefront-v2.2(1).zip`.  
**Requirements:** attached `threazle(2).pdf`, BRD v1.0.  
**This delivery:** revised Next.js customer storefront, mobile header/menu improvements, frontend fixes, and a requirement-by-requirement audit. The backend, database, admin application and live deployment have not been changed.

> The storefront does not yet fulfil the entire BRD. Read `docs/CLIENT-REQUIREMENTS-AUDIT.md` for implemented source, repairs, missing backend/content and untested production requirements. Do not substitute a visible page for a verified integration.

## Start locally

Use Node.js 22 or newer, as specified by this project's existing engine configuration.

1. Back up your current project and preserve `.env.local`.
2. Extract this ZIP into a new folder. Copy your existing `.env.local` into its `threazle-storefront` root, without committing it.
3. Install using the supplied lockfile:

```bash
npm ci
```

The dependency versions are retained from the uploaded lockfile; v2.3 updates its package version only. No new npm dependency was added. Review any install/audit warnings rather than disabling checks or running a forced major upgrade.

### Design preview, without backend

Create `.env.local` from `.env.example` and set:

```dotenv
NEXT_PUBLIC_DATA_MODE=demo
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_INDEXING=false
```

```bash
npm run dev
```

Open `http://localhost:3000`. Preview uses the existing 14 sample designs and eight fabrics. Catalog, customization and bag interactions are local. There is no fake account login, real payment, coupon approval, message delivery or order creation. Preview and API browser-storage keys are separate.

### Existing API integration

Preserve your own working public configuration:

```dotenv
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_INDEXING=false
NEXT_PUBLIC_IMAGE_HOSTS=
NEXT_PUBLIC_SUPPORT_EMAIL=
NEXT_PUBLIC_WHATSAPP_NUMBER=
```

Use the same Supabase project as your Express backend. This code follows the supplied Supabase/PostgreSQL/Prisma backend, not the earlier MariaDB installer. No database connection belongs in this frontend.

For local backend access, the existing Express `CORS_CUSTOMER_URL` must match `http://localhost:3000`. Configure Supabase callback/recovery allowlists for the storefront origin and `/auth/callback`. Extra image hosts are exact HTTPS hostnames, comma separated. Contact and social settings stay empty until the business supplies them.

Never put `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, payment keys, SMTP credentials or a database password in a `NEXT_PUBLIC_` variable. Restart/rebuild after environment changes. API failures never switch to demo products automatically.

## What v2.3 changes

- Mobile header: menu/search, centred wordmark, bag. Account and saved pieces are in the roomy collection drawer.
- Mobile drawer: search, arrivals/sale edit, photographs, expandable category groups, ready/custom/fabric/size-guide paths and separate support/account tiles.
- Existing header policy preserved: home and editorial/static pages reveal on upward scroll; commerce pages remain normal non-sticky document flow.
- CMS hero uses its actual slide count. Homepage product sections are manual/touch carousels.
- `/new-arrivals` is correctly scoped; `/shop` browses the full collection.
- Primary product image normalization, fabric Quick look, proper missing-fabric/CMS handling and a more complete public sitemap.
- Recent account orders, owner-aware saved-state cleanup, async race guards, delivery validation, measurement-help corrections and clearer demo states.

Grid choices, typography packages, supplied photographs, customization steps and the existing API endpoint contracts are retained.

## Run the actual checks

```bash
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The 16 browser scenarios run against a separate demo Next server on port 3100, in desktop/mobile projects. That port must be free. They do not create real purchases. Full live acceptance is a separate step.

Read-only API reachability check:

```bash
node --env-file=.env.local scripts/check-api.mjs
```

This check does not prove browser CORS, authentication, database integrity or order processing.

## What was verified in the editing environment

153 source/HTTP-mock checks passed. Syntax transpilation passed for 95 application files and two browser spec files, with 277 local import references resolved. Both CSS files parsed; 151 WebP files decoded. Thirty-six static layout specimens were measured at six widths.

Dependencies could not be installed here. Therefore the actual vendor type-check, Next build, hydrated React behavior, Playwright workflow suite, live Supabase/backend purchases and production performance are **not verified**. Static screenshot specimens use fallback fonts and are not screenshots of a running Next.js build.

## File locations

```text
src/components/MobileNavigation.tsx  New mobile collection drawer
src/components/Layout.tsx            Header, footer, search and bag
src/styles/refinement.css            Scoped v2.3 styling after globals.css
src/components/ProductShelf.tsx      Homepage product carousels
src/views/                          Customer page components
src/api/                            Existing Express contract adapters
src/lib/                            Shared formatting, validation and UI helpers
src/providers/AuthProvider.tsx       Supabase session state
src/context/store.tsx                Cart, wishlist and order view state
src/app/                            Next routes, metadata, robots and sitemap
scripts/test-audit.cjs               New source regression suite
public/images/                      Retained supplied photographs/references
```

## Before deployment

Follow `docs/CLIENT-REQUIREMENTS-AUDIT.md`, `docs/BACKEND-BLOCKERS.md` and `docs/LIVE-ACCEPTANCE.md`. In particular, the reference API still lacks an online PSP checkout, several BRD filters, a public reviews system and verified order-number/contact tracking. Those are not simulated in the frontend.

Use the same project root in Vercel with the Next.js preset; this is not a static export. Host Express separately. Preserve exact CORS origins and approved Supabase redirects. Keep indexing off until real content, policies, authentication and purchasing are accepted. Uploading this ZIP does not deploy the backend or apply database migrations.
