# Threazle v2.3 — update guide

## Files to use

Use `Threazle_Storefront_v2.3_Audited.zip` as the new frontend source. It is based on your uploaded v2.2 archive, not a new template. Preserve your previous project and `.env.local` before extracting it.

The client's full BRD is **not yet completely implemented**. The detailed audit distinguishes present source, repairs, missing backend/content and unverified production functions. Read `Threazle_v2.3_Client_Requirements_Audit.md` or the same document inside `docs/CLIENT-REQUIREMENTS-AUDIT.md`.

## Mobile changes

The mobile header now contains menu/search, the centred THREAZLE wordmark, and the shopping bag. Account and wishlist remain accessible in the drawer rather than crowding the top row.

The new menu has collection photographs, expandable groups, ready/custom choices, fabric and size-guide links, arrivals/sale shortcuts, and separate account, wishlist, tracking and support tiles. It scrolls within the screen and uses native dialog/focus behavior.

Your previous route-specific header policy is retained: home/static/editorial pages reveal on upward scrolling; catalog, product, checkout and other commerce pages do not become sticky.

## Main functional repairs

CMS banner counts are dynamic; homepage shelves are carousels; New Arrivals is actually filtered; `/shop` provides the full catalog; product primary images are respected; fabric Quick look is implemented; missing fabric/CMS pages are handled correctly; recent account orders are displayed; account-switch state, async responses, measurement help and delivery validation are strengthened.

The supplied photos and Playfair Display/Inter font dependencies are retained. No new photography or font binaries are included. Optional mobile previews are static layout specimens, not a running Next.js build.

## Installation

Open the extracted `threazle-storefront` folder and run:

```bash
npm ci
npm run typecheck
npm test
npm run dev
```

Keep your existing `.env.local` to connect the existing API. To view the design without backend services, set `NEXT_PUBLIC_DATA_MODE=demo` and `NEXT_PUBLIC_ENABLE_INDEXING=false`. Open `http://localhost:3000`.

For build/browser checks:

```bash
npm run build
npx playwright install chromium
npm run test:e2e
```

No dependency was added. The uploaded lockfile was preserved except for the package's v2.3 version metadata. The full dependency installation and Next runtime were unavailable in the editing environment; they still need verification on your development machine.

## Results and remaining work

153 source checks passed, including mocked HTTP tests. Syntax/import checks passed for 95 application files and two browser specs; 151 WebPs decoded; 36 static layout specimens had no measured document overflow/header collisions. This does not certify real authentication, checkout, payment handling, database transactions, browser hydration or performance.

Full-client completion still needs online payments, missing facets/sales sorting, reviews/approved content, the agreed guest-verification/account-claiming flow, notification delivery, analytics and the separate admin/backend/operations work. Actual server eligibility, idempotency, stock and rewards checks must be validated in staging.

No live website, backend, database or admin panel was changed by this ZIP.
