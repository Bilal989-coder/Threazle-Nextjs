# Threazle v2.3 — Client requirements audit

**Review basis:** `threazle-storefront-v2.2(1).zip` and `threazle(2).pdf`, Threazle BRD v1.0, 22 July 2026, 23 pages.  
**Deliverable:** revised Next.js customer storefront, version 2.3.0.  
**Scope:** source review and frontend repairs. This is not a live-site, database, payment-provider or admin-panel certification.

## Verdict

**The supplied storefront does not fulfil the entire BRD yet.** It contains substantial customer-facing functionality, but the BRD also covers an admin application, backend business rules, online payments, notification delivery, analytics, production infrastructure and approved business content. Those cannot be confirmed from this storefront archive.

This update repairs identifiable frontend problems and improves mobile navigation without replacing the existing integration architecture. An older supplied `Threazle-main.zip` was consulted for API compatibility only; it was not treated as proof that a running backend has those capabilities, and it has not been modified.

The project remains Next.js with Supabase Authentication and the existing Express API. Do not connect it directly to the earlier MariaDB SQL design: that is a different architecture from this source's Supabase/PostgreSQL/Prisma integration.

### Reading the status column

- **Source present:** the route/component and integration code exist. This does not mean the live workflow has been verified.
- **Repaired:** changed in v2.3. Helper tests or static checks may cover part of the change; actual React/browser tests still need to run.
- **Partial / dependent:** part exists, but a missing API, approved content or live integration prevents full compliance.
- **Not in this ZIP:** the requirement belongs to another application or infrastructure.
- **Optional / deferred:** explicitly conditional, optional or in the BRD's later roadmap.

No percentage-complete score is assigned because it would misleadingly combine untested backend functions with visible frontend screens.

## 1. What changed in this release

| Issue found | Repair | Evidence |
|---|---|---|
| Mobile header packed branding, several utility icons and text into one row | Mobile row now has menu/search on the left, a centred wordmark and bag on the right. Account and wishlist remain reachable in the drawer. Desktop branding remains. | `src/components/Layout.tsx`, `src/styles/refinement.css` |
| Mobile menu was an undifferentiated list | Added collection photographs, one-open-at-a-time category disclosures, ready/custom links, category children, search, arrivals/sale links and separate account/support tiles. | `src/components/MobileNavigation.tsx` |
| Clicking a modal link to the current URL could leave the overlay open | Navigation, search, quick-view and mini-cart links explicitly close their overlay. | `Layout.tsx`, `MobileNavigation.tsx`, `ProductCard.tsx`, `ui.tsx` |
| Independent dialogs could restore page scrolling while another was still open | Added an idempotent, reference-counted body-scroll lock for shared Modal instances. Backdrop dismissal no longer treats inner padding as outside the dialog. | `src/lib/dialog-scroll.ts`, `src/components/ui.tsx` |
| Homepage hero navigation assumed three slides | Slide bounds and displayed count use the returned CMS banner length, with the three-slide editorial fallback only when no CMS banners exist. | `src/lib/catalog-presentation.ts`, `src/views/Home.tsx` |
| Homepage product sections were fixed short grids | Added manual, touch-scrollable product carousels and passed up to eight products to each shelf. | `src/components/ProductShelf.tsx`, `src/app/page.tsx` |
| New Arrivals could behave like the entire catalog | `/new-arrivals` now applies the supported `isNew` filter. A separate `/shop` route intentionally browses all products. | `src/app/new-arrivals/page.tsx`, `src/app/shop/page.tsx` |
| Search and some filter fields could show stale values after navigation | Added a visible search field on the results page, synchronized URL-driven fields and normalized page numbers. | `src/views/Catalog.tsx`, `src/views/Fabrics.tsx`, `src/lib/server-catalog.ts` |
| Primary image flags from the API were not consistently respected | Normalize product images so an explicitly marked primary image is first, without mutating the response or discarding other images. | `src/lib/catalog-presentation.ts`, `src/api/catalog.ts` |
| Unknown fabric URLs could surface a service error instead of a missing-resource state | Fabric 404 becomes `null` for the route's not-found handling; genuine service failures remain visible errors. | `src/api/catalog.ts`, `src/app/fabrics/[slug]/page.tsx` |
| Fabric library did not provide the BRD's detail modal/drawer | Added a fabric-specific Quick look dialog with details and a compatible-design action, alongside the existing detail route. | `src/views/Fabrics.tsx` |
| CMS drafts/missing pages needed clearer handling | Only published CMS responses are rendered; unknown missing slugs return not-found, and known unpublished policy pages remain honest unavailable states with noindex. | `src/api/catalog.ts`, `src/app/pages/[slug]/page.tsx` |
| Public sitemap omitted some public resources | Added `/shop`, sale, fabric details and published known CMS pages; private order/account URLs remain excluded. | `src/app/sitemap.ts` |
| Late async responses could overlap identity/resource changes | Capture each resource loader for its key; guard Supabase startup-session races; isolate wishlist/order results by identity; separate demo and API browser storage. | `src/hooks/useResource.ts`, `src/providers/AuthProvider.tsx`, `src/context/store.tsx` |
| Account overview lacked actual recent orders | Added recent order cards using the existing authenticated orders endpoint, with independent loading/error states. | `src/views/Account.tsx` |
| Address/postal/email input, reward changes and unavailable custom configurations needed stronger checks | Added shared delivery validation, fresh redemption-limit checks, state resets and blocking of custom checkout without required measurement definitions. | `src/lib/checkout-validation.ts`, `src/views/Checkout.tsx`, `src/services/reprice.ts` |
| Measurement help could classify waistcoat length as waist, or trouser waist as trouser length | Corrected field-key matching and removed unapproved instructions to add arbitrary ease. Unknown fields ask for the store's guidance. | `src/lib/measurement-guide.ts`, `src/components/MeasurementGuide.tsx` |
| Preview forms could suggest genuine service availability | Added clear demo-only notices; no fake login, order, coupon approval or contact delivery is generated. | `src/views/Checkout.tsx`, `src/views/Account.tsx`, `src/views/Info.tsx` |

These are repairs to the uploaded version, not a promise that no further defects exist. No new photography, stock quantities, business prices or payment providers have been invented.

## 2. BRD section-by-section assessment

### Sections 2, 4, 5 and 6 — Business modes, scope, users and sitemap

| BRD requirement | Status | Source evidence / remaining work |
|---|---|---|
| Five initial categories, configurable through admin | Source present / dependent | Categories come from `api/catalog.ts`, not a fixed live frontend list. Demo fixtures contain five categories. Admin editing and persistence are outside this archive. |
| Ready-made, customized, or both on a product | Source present | `views/Product.tsx` uses product capabilities and default buying mode. Production endpoint must validate those capabilities independently. |
| Home, category, product, fabrics, tailoring and size guide routes | Source present | App Router page files exist. `/shop` is an additional convenience route, not a client-mandated URL. |
| Cart, checkout, confirmation, search and support/CMS pages | Source present / dependent | Routes exist. Orders and policy content require real API responses. |
| Login/signup, account, orders, measurements, wishlist and rewards | Source present / dependent | Real Supabase/customer API adapters exist; no fake demo authentication. Live configuration and account lifecycle remain untested. |
| Mega-menu: Ready-made / Custom Stitch / By Fabric / By Occasion | Partial | Ready/custom, fabric entry and category hierarchy are implemented. Occasion filtering/menu targets need an actual backend filter; no fake target was added. |
| Guest checkout without compulsory registration | Source present / dependent | Checkout supports anonymous requests. A genuine guest purchase still needs staging validation. |
| Staff roles and permissions | Not in this ZIP | The customer's storefront is not the staff admin. Supabase sign-in is not proof of staff authorization. |
| Store locator | Optional / conditional | Only required if physical stores exist. No store addresses were fabricated. |
| Native apps, AR scanning, multi-currency, workshop scheduling | Optional / excluded from launch scope | Not added; they are explicitly outside Phase 1 in section 4.2. |

### Section 7 — Ready-made versus Stitch/Customize flow

| BRD requirement | Status | Source evidence / remaining work |
|---|---|---|
| Obvious buying-mode tabs and configurable default | Source present / repaired | `views/Product.tsx`; same-product URL mode changes now update the selected supported mode. |
| Available ready-made sizes, price and Add to Cart | Source present | Sizes are disabled by source availability; reprice/availability checks run before checkout. Server concurrency is not validated here. |
| Step A: style options with thumbnails | Partial | Source supports one custom `variantId`. Multiple independent collar/sleeve/length groups need a richer backend contract. Existing collar-reference labels are retained. |
| Step B: compatible fabric swatches, composition and price effect | Source present / dependent | Product-compatible fabric IDs and price endpoint are used. Per-meter/per-suit consumption remains a backend business-rule gap. |
| Step C: category-specific forms, saved profiles, measurement help | Source present / dependent | Fields come from category templates. Undefined templates now block custom checkout. Required/optional field semantics and template versioning need backend support/approval. |
| Step D: notes, add-ons, price and review | Source present | Data-backed options and current server quote. Server must reject invalid product/add-on/style combinations itself. |
| Preserve specification on each cart/order line | Source present / dependent | Cart copies measurements; order request sends the copied `measurementSnapshot` and omits the live profile ID to avoid the older reference backend preferring changed profile values. Server persistence still requires a live test. |
| Custom lead time at product/cart/checkout/confirmation | Source present / dependent | Source lead-time fields and receipt data are used. Actual working-day rules and estimates must be confirmed by the business. |
| Live price changes and authoritative server recalculation | Source present / backend review needed | `computePrice`, `services/reprice.ts` and order API exist. Frontend checks cannot secure a malicious direct API request. |

### Section 8.1 — Home page

| BRD requirement | Status | Source evidence / remaining work |
|---|---|---|
| Admin-managed hero banners with dates and destination links | Repaired / dependent | All returned banners are reachable. The existing CMS endpoint controls active schedules; admin management is outside this ZIP. |
| Five category tiles and Shop by Fabric entry | Source present | `views/Home.tsx`; actual category images remain content-dependent. |
| New Arrivals and Best Sellers carousels | Repaired / partial | Both sections are scrollable carousels. The source best-sellers service can backfill unsold items; current honest UI says Selected favorites rather than claiming every item is a proven bestseller. Confirm ranking and final heading. |
| Three-step tailoring teaser | Source present | `views/Home.tsx`, with link to the explanatory page. |
| Testimonials / reviews strip | Missing content/API | No fabricated testimonials were inserted. Requires approved reviews/content and a matching public read contract. |
| Newsletter signup | Partial | Form calls the supplied endpoint; recording a pending request is not email delivery, subscription management or an unsubscribe implementation. |
| Floating WhatsApp contact | Source present / configuration needed | Uses the approved configured number. Without one, it links to Contact. This is not automated WhatsApp order notifications. |
| Instagram/social feed | Optional | Not implemented as a live feed. Social links are not a feed and are not counted as one. |

### Sections 8.2 and 8.3 — Listings and product details

| BRD requirement | Status | Source evidence / remaining work |
|---|---|---|
| Price, fabric type, mode and discount listing filters | Source present | Existing supported query parameters, active chips and pagination retained. |
| Color, size availability and occasion filters | Missing backend contract | Not simulated by filtering only one downloaded page; that would produce incorrect totals and omit matching products elsewhere. Add server filters and facet values before UI activation. |
| Newest and price sorting | Source present | Existing server sort parameters retained. |
| Best Selling listing sort | Backend correction needed | The older reference source sorts this option by review count, not sales. The frontend correctly avoids presenting that as an accurate sales ranking. |
| Image hover, names, prices, badges, wishlist and quick view | Source present / repaired | Product cards and unique images retained; primary image flags normalized; quick-view navigation closes its modal. |
| Pagination or infinite scroll | Source present | Pagination is acceptable under the BRD. Integer page inputs now normalized. |
| Extra 2/4/6 grid controls requested in conversation | Preserved | Wide-screen choices retained; phones stay at two readable columns. This is a user enhancement, not a BRD requirement. |
| PDP gallery, zoom, multiple angles, fabric close-ups | Source present / content dependent | Gallery and deliberate zoom exist. Asset quality, correct angles and close-ups depend on supplied photos. Existing v2.2 cover-fit stage is retained; lightbox uses contain. |
| Return-policy summary and size guide | Partial | Links and guide UI exist. Published, approved return terms and product/category standard-size charts are still needed; a link alone does not fully satisfy a policy summary. |
| Related products / Complete the look | Partial | Related endpoint and cards exist. Guaranteed complementary outfit pairing requires explicit merchandising data or an approved matching rule. |
| Ratings and product reviews | Missing API | The reference serializer supplies zero/no usable review records. Do not invent ratings or mistake decorative stars for implementation. |

### Sections 8.4, 8.5 and 8.6 — Checkout, accounts and loyalty

| BRD requirement | Status | Source evidence / remaining work |
|---|---|---|
| Mixed ready/custom cart, quantities and Edit Customization | Source present | Existing cart snapshot and editing logic retained. Differently measured garments remain distinct. |
| Contact, address, delivery, payment, rewards and order review | Source present / repaired | `views/Checkout.tsx`; validation and fresh loyalty-limit checks improved. No real checkout was run here. |
| COD plus at least one online gateway | Partial — COD integration only | `/payments/methods` in the reference supports COD. Card/JazzCash/Easypaisa require backend/provider checkout and verified callbacks. No mock paid button has been added. |
| Coupon entry and redemption | Source present / backend review needed | Uses the existing apply-coupon and order endpoints. Concurrent limits and stacking need staging/server tests. |
| Optional account creation after guest order | Partial | Account routes exist, but attaching a historic guest order securely to a newly verified account needs a backend claim/verification flow. |
| Account dashboard with recent orders and points | Repaired / dependent | Added recent orders from the authenticated endpoint, retaining points/measurement shortcuts. |
| Orders list/details and tailoring timeline | Source present / dependent | Whole-order statuses and customer-facing timeline exist. Correct workflow data and notifications depend on backend operations. |
| Multiple named measurement profiles and address book | Source present / repaired | CRUD adapters retained, validation and account-switch cleanup improved. Live server ownership enforcement not tested. |
| Wishlist | Source present / repaired | Guest and authenticated paths retained. Results/mutations are isolated by account owner to prevent stale responses displaying another user's saved state. |
| Guest tracking by order number + phone/email | Different from BRD; backend change needed | Existing API uses a private order UUID as access capability. Current UI matches that contract; it does not falsely claim verified number/contact lookup. |
| Earn on completed order, redeem under configured limits, history/expiry | Partial | Balance/history/config and redemption UI exist. Earning, expiration, refund reversals and atomic ledger integrity are backend work, not established by these views. |
| Membership tiers | Optional / needs scheduling confirmation | Sections 8/9 call these optional Phase 2; section 15 places tiers in the post-launch backlog. Do not silently treat either schedule as final. |

### Sections 9, 10 and 14 — Admin, quality and design

| BRD requirement | Status | Source evidence / remaining work |
|---|---|---|
| Admin dashboard; product/fabric/pricing/order/customer management | Not in this ZIP | Requires a separate staff application and protected APIs. This storefront update neither creates nor certifies them. |
| Admin loyalty/CMS/coupons/staff/audit/report exports | Not in this ZIP | Customer read adapters do not demonstrate admin CRUD, permission enforcement, reports or exports. |
| Mobile/tablet/desktop layout | Repaired; partial verification | Mobile header/drawer redesigned. 36 static specimens checked across six widths. Actual hydrated app interaction and device QA remain unrun. |
| Under 2.5 seconds on 4G for PLP/PDP | Unverified | No Lighthouse/field metrics or production backend measurements available. Do not infer performance from a static screenshot. |
| SSR or static rendering for SEO | Source present | Next App Router server pages, page metadata and sitemap exist. Build is not yet verified; root layout remains force-dynamic. |
| SEO visibility and indexing | Repaired / deployment dependent | Public sitemap improved. Indexing defaults to false pending approved content/live acceptance. Deployment must enable it deliberately. |
| GA4 and Meta Pixel | Missing configuration and integration | No measurement scripts/event wiring were added silently. Need approved IDs, privacy/consent decisions and event validation that excludes private order references and measurements. |
| WCAG AA effort | Partial | Native dialogs, focus handling, labelled forms, keyboard controls and reduced motion exist. No complete screen-reader/contrast/WCAG certification performed. |
| Security, hosted payments, password hashing, rate-limited login/OTP | Partial / other systems | Frontend guards/sanitizer/media allowlist exist; password and API controls belong to Supabase/backend. No raw card inputs. Security review still required. |
| 5,000+ SKUs and seasonal spikes | Unverified | API pagination exists. Sitemap traversal has an explicit 5,000-record guard; larger catalogs need segmented sitemaps. Capacity/load testing remains outstanding. |
| Daily DB backups and redundant asset storage | Not in this ZIP | Requires hosting/operations evidence and restore tests. |
| Browser support: latest two browser versions, iOS/Android | Unverified | Chromium static-layout checks are not Safari/Firefox/Edge/iOS tests. |
| PKR and English, Urdu-friendly fallback later | Source present / future verification | Current UI uses PKR/English and system fallbacks. Urdu copy/font coverage should be tested when introduced. |
| Navy/charcoal, antique gold, ivory, serif headings, sans body | Source present / preserved | Existing Playfair Display/Inter packages and theme retained; mobile styles respect the existing palette. Specific fonts are design choices, not names required in the BRD. |
| Design-system components and page states | Source present / repaired | Product cards, steps, swatches, price summary, modal, drawer, breadcrumbs and loading/empty/error patterns exist. Full Figma file/flowchart deliverables are not in this archive. |

## 3. Phase interpretation

Section 15's detailed roadmap places ready-made/COD in Phase 1, custom tailoring/online payments in Phase 2, and loyalty/marketing in Phase 3. The uploaded storefront already contains features spanning those phases; they were not deleted to force a Phase 1-only site.

Section 4's phase wording and the optional-tier scheduling elsewhere are not perfectly consistent with that roadmap. Obtain client sign-off on release scope. A Phase 1 acceptance must not be represented as completion of all four phases.

## 4. Remaining launch gates, in priority order

1. Run the actual dependency install, vendor type-check, Next build and Playwright suites. Fix any integration/build errors before replacing a live version.
2. Confirm the backend actually deployed is the same contract as the reference. Preserve Supabase project, allowed origins and callback URLs; never expose server credentials.
3. Repair server eligibility, idempotency ownership/fingerprint checks, stock/coupon/rewards concurrency and custom fabric unit pricing. Client guards do not replace these checks.
4. Add the approved online payment method with server-side payment confirmation; keep COD-only until then.
5. Add missing filters/sales sort and review endpoints, then connect their real data to the interface. Complete post-guest-order account claiming and verified guest tracking if required for this release.
6. Publish approved photographs, exact measurement instructions/size charts, return-policy summaries, shipping rules, business contact information and lead times. Existing local photos are not newly licensed by this work.
7. Configure delivery of transactional email/SMS/WhatsApp, newsletter management, analytics and the appropriate consent choices. Confirm operations, backups and restore procedures.
8. Run staging purchases and client UAT on real devices. Only then enable indexing and start accepting live traffic/orders.

## 5. Evidence and limitations

- **153/153 source tests passed:** 66 commerce/HTTP-adapter checks, 41 prior UI/helper checks, 46 v2.3 regression checks. HTTP calls are mocked.
- **95 application TS/TSX files and two browser-test files** passed syntax transpilation; **277 internal import references** resolved. This is not `tsc --noEmit` with installed vendor types.
- Both CSS source files parsed successfully. This is not a production Tailwind/Next CSS build.
- **151 WebP raster assets** decoded without errors. Decoding does not establish image suitability or licensing.
- **36 static source-DOM specimens** at 320, 375, 390, 430, 768 and 1440px showed no document-level horizontal overflow or measured mobile header overlap. Native dialog sizing was inspected.
- Static specimens use hook stubs, plain link/image adapters, representative icon paths, a preview-only CSS reset and system fallback fonts. They do not run React hydration, application effects or Next.js. Screenshots are explicitly layout previews.
- **16 Playwright scenarios are included across two spec files, not executed here.** Configured desktop/mobile projects run those scenarios after a real install; no pass count is claimed for that suite.
- Registry access was unavailable; an offline install also returned `ENOTCACHED`. Full dependency type-check, Next development/production runtime, real browser workflow tests, API/Supabase interactions, payments, database concurrency, load tests and complete accessibility checks remain unverified.

Machine-readable results from this delivery are in `docs/validation-v2.3/`. Older reports have been moved into `docs/history/pre-v2.3-reports/` and must not be used as current validation.

## 6. Practical staging checklist

Test ready-made and custom orders; the last available size purchased concurrently; a changed price between product and checkout; different measurements for the same product; edits to a saved profile after placing an order; a duplicate submission; timeout/retry reconciliation; account A signing out and account B signing in; wishlist/address/profile ownership; coupons combined with points; private-order access denial; invalid/missing CMS and product URLs; mobile drawer keyboard/close behavior; and the agreed home/static-only header reveal policy.

A successful frontend helper test does not establish the corresponding server transaction. Record the actual staging outcomes before final client acceptance.
