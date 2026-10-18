> Historical revision note from the input project. Current results and scope: `VERIFICATION.md` and `CLIENT-REQUIREMENTS-AUDIT.md`.

# Threazle UI revision 2.2

| # | Request | What changed | Where |
|---|---|---|---|
| 1 | Collection dropdown missing on category pages | "Collection" selector now on every listing page; switching moves to that collection and keeps your filters | `src/views/Catalog.tsx` |
| 2 | Filter list scrolls away / long empty column | Filter sidebar sticks while products scroll, scrolls on its own only if taller than the screen, and ends with the listing | `globals.css` (UI REVISION 2.2) |
| 3, 6 | Images overlapping / card colour showing | All product photos fill one standard 3:4 frame edge to edge (cover, focused on the upper body) on cards, quick view, bag, gallery and thumbnails | `Photo.tsx`, `ProductGallery.tsx`, `Layout.tsx`, CSS |
| 4 | Mega menu image and spacing | Balanced columns with dividers, collection description, framed photo with caption below, responsive widths | `Layout.tsx`, CSS |
| 5 | Product page zoom + sticky images | Hover magnifier (2.5×, follows the cursor, uses the full-resolution file); gallery stays pinned while details scroll; full-screen viewer unchanged | `ProductGallery.tsx`, CSS |
| 7 | Measurement pop-up placeholder text | Real step-by-step instructions for every measurement, "before you begin" checklist, body-vs-garment note; used in the pop-up and the Size Guide page. Backend help text still takes priority when provided | `src/lib/measurement-guide.ts`, `src/components/MeasurementGuide.tsx` |
| 8 | Apply / Back buttons | Solid navy Apply button that's always clickable; Back is a bordered secondary button | `Checkout.tsx`, CSS |
| 9 | Preview wording and disabled order button | All "preview / demo / sample / supplied backend" text removed. Place-order, coupon, tracking and sign-in buttons are enabled; if the backend isn't connected they show a normal "temporarily unavailable" message. Contact details come from new settings | `Layout.tsx`, views, `src/lib/config.ts`, `.env.example` |
| 10 | Sign-in page | Split layout: brand photo with account benefits, card with Sign in / Create account tabs, show-password, forgot link beside the field, guest option | `Account.tsx` (`AuthScreen`), CSS |
| 11 | Wishlist count | Heart in the header shows a count badge like the bag (also visible on phones) | `Layout.tsx` |
| 12 | Pages not starting at the top | Every page change starts at the top; Next/Previous scroll to the top of the listing | `Layout.tsx`, `Catalog.tsx` |
| 13 | Banner image | Hero crop keeps face and garment in view at all widths | CSS |

## Bugs fixed along the way
- **"Add to bag" could stay greyed out** after loading (server/browser markup mismatch). Fixed.
- **Saved hearts, bag/wishlist counts, cart, checkout and wishlist pages** could render differently on the server and in the browser after a reload, so React left wrong attributes in place. A small `useMounted()` hook now keeps browser-only data out of the first render.

## New settings (`.env.local` / Vercel → Environment Variables)
```
NEXT_PUBLIC_SUPPORT_EMAIL=
NEXT_PUBLIC_WHATSAPP_NUMBER=      # digits only, e.g. 923001234567
NEXT_PUBLIC_SUPPORT_PHONE=
NEXT_PUBLIC_BUSINESS_ADDRESS=
NEXT_PUBLIC_BUSINESS_HOURS=
NEXT_PUBLIC_INSTAGRAM_URL=
NEXT_PUBLIC_FACEBOOK_URL=
NEXT_PUBLIC_TIKTOK_URL=
```
Empty values are simply hidden. For live orders, set `NEXT_PUBLIC_DATA_MODE=api` with the backend and Supabase values (see README §2).

## Verification
- `npm run typecheck`, `npm test` (41/41 UI checks), `npm run build`: pass.
- Browser sweep of 20 routes × phone/tablet/desktop on both `next dev` and the production build, with a saved item and a filled bag: no console or hydration errors, no broken images, no horizontal scrolling, no preview wording.
- Interaction checks: collection switching, sticky filters, pagination scroll, wishlist badge, hover zoom, sticky gallery in Stitch mode, measurement guide, coupon and place-order buttons.
