# Staging acceptance checklist

Use a separate staging Supabase project/backend with disposable stock and customer accounts. Do not run order-creation tests against live inventory.

## Build and configuration

- [ ] Node 22+, `npm install`, save reviewed lockfile, `npm run typecheck`, `npm test`, `npm run build` all pass.
- [ ] `npm audit` reviewed; vulnerable runtime dependencies addressed.
- [ ] `npm run test:e2e` passes on the explicit preview server.
- [ ] Public API URL is correct, uses HTTPS in production, and includes `/api/v1`.
- [ ] Customer origin in backend CORS matches the actual frontend origin, including scheme/port.
- [ ] Supabase project matches the backend; redirect URLs work.
- [ ] Catalog, fabric and CMS images load from approved image hosts.

## Shopping and navigation

- [ ] Desktop menu stays open while moving from label to menu, closes on exit/Escape and works with keyboard ArrowDown.
- [ ] Header remains reachable while scrolling; touch navigation at 320/390/768 widths has no horizontal page overflow.
- [ ] Search, category, mode, sale, price/fabric filters and pagination reflect real results and URL back/forward navigation.
- [ ] Ready-made quantity cannot exceed published stock; missing size is rejected.
- [ ] Each product style/fabric/add-on belongs to that product; custom measurement limits match the tailor's definition.
- [ ] Editing a cart line replaces it; equal configurations merge; two differing fits stay separate.
- [ ] Server unavailable gives an error and retry option, never an invented successful order or sample catalog.

## Authentication and account

- [ ] Signup creates the intended customer record; confirmation and password recovery work.
- [ ] Expired sessions do not silently place a guest order.
- [ ] Saved address/profile CRUD works and cannot access another customer's IDs.
- [ ] Account switch/sign-out removes private cached data and custom bag entries as described.
- [ ] Guest wishlist merges once and logout does not expose another account's list.

## COD checkout — disposable staging data only

- [ ] Shipping fee and free-shipping threshold match backend totals after discounts.
- [ ] Invalid/expired coupon, insufficient points and overlapping discounts are rejected safely.
- [ ] Live response creates a real order UUID and receipt; payment remains pending COD.
- [ ] Double-click/duplicate request creates one order.
- [ ] Simulate a committed-order response timeout, then retry unchanged with the same key: one order remains.
- [ ] Reusing a key for different payload is rejected by the backend (server change may be needed).
- [ ] Two concurrent customers attempt the last stock unit: do not confirm both.
- [ ] Change a saved measurement profile after adding an item: the order retains the reviewed snapshot.
- [ ] Eligible cancellation updates stock/payment and cannot run twice incorrectly.
- [ ] Private order URL and account-owned order endpoints enforce the intended access boundaries.

## Launch content

- [ ] Approved photography/licensing, authentic product descriptions and accurate stock.
- [ ] Shipping/returns/privacy pages, contact details and measurement instructions published.
- [ ] Pending messages have an actual delivery/operations process and newsletter unsubscribe support.
- [ ] Backend blockers in `BACKEND-BLOCKERS.md` resolved or explicitly accepted.
- [ ] Only then set `NEXT_PUBLIC_ENABLE_INDEXING=true` and redeploy.
