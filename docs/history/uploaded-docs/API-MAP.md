# API map — source-derived, not invented

Source: `Threazle-main/backend/src/routes/`, its service/serialization files, and `Threazle-main/frontend/src/types/`. All paths below follow `NEXT_PUBLIC_API_URL` (normally `.../api/v1`).

## Transport

`src/api/client.ts` reads `{ success: true, data: ... }` or `{ success: false, error: { message, code, fieldErrors } }`. It handles 204 deletes and cancellation/timeouts. Mutations are NOT automatically retried. Authenticated requests use a Supabase browser session's bearer access token; no API access token is put in source code. A missing session throws rather than falling back to guest permissions. API responses are not replaced with sample data.

## Authentication

Supabase JS handles email/password login, signup, confirmation and password recovery directly. There are no `/auth/login` or `/auth/register` Express routes added here. Signup metadata is `full_name` and `account_type: customer`, matching the source's profile/customer provisioning. Authenticated checkout also preflights `GET /auth/me` and requires a customer identity.

## Endpoints

| Capability | Source endpoint | Storefront use |
|---|---|---|
| Categories | GET `/categories`, GET `/categories/:slug` | Header, listings, measurements |
| Product listing | GET `/products` | Search and URL-driven pagination/filtering |
| Product by slug | GET `/products/slug/:slug` | Product page, pre-checkout revalidation |
| Product by ID | GET `/products/:id` | Guest wishlist hydration |
| New arrivals | GET `/products/new-arrivals` | Home shelf |
| Best sellers | GET `/products/best-sellers` | Curated home shelf; does not manufacture rankings |
| Related products | GET `/products/:id/related` | Complete-the-look shelf |
| Price calculation | POST `/products/compute-price` | Size/style/fabric/add-on price quote |
| Fabrics | GET `/fabrics`, GET `/fabrics/types`, GET `/fabrics/slug/:slug` | Fabric list/detail and compatibility |
| Add-ons | GET `/addons` | Product-specific extras |
| Banners | GET `/cms/banners?placement=homepage_hero` | Hero images/links when supplied |
| Pages | GET `/cms/pages/:slug` | Sanitized published policy/about/FAQ content |
| Customer | GET/PATCH `/customers/me` | Account name/phone |
| Addresses | GET/POST `/customers/me/addresses`; PATCH/DELETE `/:id` | Address book and checkout |
| Measurements | GET/POST `/customers/me/measurement-profiles`; PATCH/DELETE `/:id` | Saved profiles and validation |
| Wishlist | GET `/customers/me/wishlist`; POST/DELETE `/:productId` | Account favorite products |
| Merge wishlist | POST `/customers/me/wishlist/merge` | Guest-to-account merge |
| Loyalty rules | GET `/customers/loyalty/config` | Earning/redemption help |
| Loyalty history | GET `/customers/me/loyalty` | Account rewards |
| Redemption limit | GET `/customers/me/loyalty/max-redeemable?subtotal=...` | Eligible checkout points |
| Enabled payments | GET `/payments/methods` | Only shows supported COD collection |
| Coupon | POST `/orders/apply-coupon` | Checks code against current subtotal |
| Place order | POST `/orders` | COD submission with idempotency key |
| Customer orders | GET `/orders` | Owned order history |
| Order detail | GET `/orders/:id` | Authenticated detail or source's private guest UUID |
| Cancel | POST `/orders/:id/cancel` | Eligible customer's cancellation request |
| Contact | POST `/forms/contact` | Records contact request; does not claim email delivery |
| Newsletter | POST `/forms/newsletter` | Records request; not a made-up mailing integration |

### Listing contract

Supported query parameters used by this storefront: `search`, `categorySlug`, `mode`, `sort`, `priceMin`, `priceMax`, `onSaleOnly`, `fabricTypes`, `page`, `pageSize`. Source product list cap is 100 per page. Arrays use repeated query parameters. Actual modes are `ready_made` and `stitch` (not `custom`). UI sorting exposes `newest`, `price_asc`, and `price_desc`.

The supplied `/products` best-selling sort currently uses review count rather than actual sales. This update deliberately does not offer that misleading sort label. The separate home `/products/best-sellers` endpoint is retained. There is no source-backed color/size/occasion listing filter or public reviews API; this update does not pretend those controls are functional.

### Product and custom configuration

Source product styles are one selected `variantId` from `product.variants`, not independent collar/sleeve groups. Ready-made selection uses `sizeLabel`, not that custom style ID. Fabric options are fetched in bounded pages and filtered to the product's explicit `compatibleFabricIds`. `addonIds` are restricted to the product's listed extras in the interface.

The custom price request is:

```json
{
  "productId": "BACKEND_PRODUCT_UUID",
  "mode": "stitch",
  "variantId": "BACKEND_STYLE_UUID",
  "fabricId": "BACKEND_FABRIC_UUID",
  "addonIds": []
}
```

Real values come from the backend, not these explanatory placeholders.

### Order contract

```text
email
items[]:
  productId, mode, quantity
  sizeLabel (ready-made)
  variantId, fabricId, addonIds, measurementSnapshot, notes (custom)
shippingAddress: fullName, line1, line2?, city, postalCode, phone
paymentMethod: cod
deliveryMethod: standard | express
couponCode?
loyaltyPointsRedeemed?
customerNotes?
idempotencyKey
```

The browser sends no authoritative unit price, line totals or shipping amount. The backend returns `{ order, pointsEarned }`; the confirmation link uses that actual order UUID.

**Snapshot correction:** the source order service prefers live `measurementProfile.values` when both a saved profile ID and snapshot are supplied. To prevent a later profile edit from changing the reviewed order, this storefront submits the copied `measurementSnapshot` and deliberately omits `measurementProfileId`. Profile selection still works in the UI.

### Source shipping rules

The supplied order service uses PKR 250 for standard delivery below a net merchandise total of PKR 10,000; standard is free at/above that threshold; express is PKR 500. It currently sets tax total to zero. The checkout preview mirrors those specific source constants in `src/lib/commerce.ts`; this is not tax advice or a newly approved business policy. A shipping-quote/config endpoint would be a better future source of truth. Final receipt values always come from the order response.

### Guest tracking

The source exposes guest order details through an unguessable private order UUID, not order-number-plus-email verification. The UI therefore asks for that private reference and never returns a dummy order for arbitrary input. Treat confirmation URLs as confidential. Private pages use noindex and no-referrer. Strengthening guest verification requires a backend change.

### Persistence

Authenticated wishlist, profiles, addresses and orders are server-backed. Guest wishlist IDs use localStorage. The bag (including explicitly entered custom measurements) uses sessionStorage for continuity in the same tab; it is not long-term protected storage or a secure secret store. Custom cart entries and cached customer orders are cleared/isolated across identity changes. The checkout retry record stores only a random key, payload hash, owner identifier, state and optional private order UUID—not raw contact/measurement values. It is deliberately retained after uncertain submission or logout to avoid creating another order accidentally.

### Retrying an uncertain checkout

An unresolved attempt is reconciled with the same key and canonical payload BEFORE a fresh stock/coupon/points check. Otherwise the order could block its own retry by having consumed the final unit. Completed server receipts are shown even if browser storage subsequently fails. On reload the contact form is intentionally not persisted: re-enter the same details, and contact support if the previous full payload cannot be reconstructed. Do not clear the retry key or begin a different order until the earlier attempt is reconciled. A secure backend lookup-by-attempt endpoint would improve this recovery workflow.


## v2.3 frontend changes (same backend contract)

- `/new-arrivals` sends the supported `isNew=true` product-list filter. `/shop` intentionally applies no arrival-only filter.
- Products normalize `images[].isPrimary` before rendering; other image order remains stable.
- Fabric/CMS HTTP 404 is treated as missing content; genuine service errors are not masked. Only published CMS pages render.
- The account dashboard uses the existing authenticated `GET /orders` to show recent orders. No new endpoint was invented.
- Guest demo storage uses `threazle.preview.cart.v2` and `threazle.preview.wishlist.v2`, separated from API-mode storage. Account responses and wishlist mutations are owner-guarded.
- CMS schedules remain server-filtered. Frontend carousel length now follows the returned banner array.

Remaining filter, payment, review and guest-verification limitations are detailed in the client audit.
