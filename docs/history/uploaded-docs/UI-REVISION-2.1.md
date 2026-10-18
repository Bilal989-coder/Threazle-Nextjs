> Historical revision note from the input project. Current results and scope: `VERIFICATION.md` and `CLIENT-REQUIREMENTS-AUDIT.md`.

# Threazle UI revision 2.1

This revision updates the existing Next.js storefront, not the Express backend, Supabase settings, database or live Vercel deployment. All six `src/api/` modules are unchanged from the supplied updated ZIP. Request payloads, actual server order IDs, authentication, pricing and checkout protections are retained.

## Requested interface changes

### Catalog
- Desktop 1200px and wider: selectable **2 / 4 / 6 products per row**.
- Tablet 768–1199px: 2 / 4 columns. Smaller screens always use two readable columns.
- The preferred density is saved in `localStorage` under `threazle:catalog-columns:v1`. It is clamped on smaller screens without losing the desktop preference.
- The sidebar has compact grouped controls, price controls, selected-filter chips and clear/reset actions. Under 961px it becomes a drawer.
- Filters and sort remain in the URL, and changing filters resets pagination.
- Supported live filters: category, buying mode, fabric type, minimum/maximum base price and sale-only; supported sorting and server pagination are retained.
- Colour, size and occasion filtering are **not** silently simulated over one page of results. Those need corresponding filter support in the supplied backend before being advertised as functional controls.
- The 'New arrivals' and 'Sale' route restrictions still override conflicting query parameters.

### Compact headings and fonts
- Reduced intro/banner padding and title sizes for interior pages, with a home-icon breadcrumb and left alignment.
- Shared display font: **Playfair Display**. Body and controls: **Inter**. The navy, gold and ivory palette is retained.
- Font binaries are installed from the Fontsource npm packages and self-hosted by Next/font. No font files are redistributed in this archive.
- Keep `src/app/fonts.ts`, package dependencies and body-scoped CSS font variables together. The font variables are resolved on `body`, where Next/font applies them.

### Photos and collar detail
- All catalog and gallery display frames use a 3:4 aspect ratio; photos keep their own natural proportions inside them.
- Different image proportions may create a small neutral margin. This is deliberate and preferable to stretching or cutting off the garment.
- Recognize existing `name-823.webp`/`name-960.webp` paths in the image manifest; use the original maximum-resolution asset and its true dimensions.
- Remove automatic pointer-hover enlargement. Thumbnail selection, swipe, previous/next controls and explicit full-screen zoom remain.
- Full-screen zoom supports keyboard controls and touch interaction; maximum useful zoom depends on original source dimensions. This cannot restore pixels absent from a source photo.
- Replace the repeated outfit photograph in known collar choices with distinct close-ups. References and crop provenance are documented in `collar-image-sources.json`.
- Do not overwrite an actual unique backend style photograph. References remain visibly labelled.

### Header policy

| Route group | Behavior |
|---|---|
| `/`, `/pages/*`, `/custom-tailoring`, `/size-guide` | Header starts in natural flow. Once scrolled away, downward movement hides it and deliberate upward movement reveals it. |
| Category/search/new arrivals/sale/fabrics | Ordinary header in document flow; no sticky or reveal behavior. |
| Product details/cart/checkout/payment/order confirmation | Ordinary header in document flow. |
| Account/auth/order tracking and other routes | Ordinary header in document flow. |

`src/lib/storefront-ui.ts` contains the explicit route whitelist. `src/hooks/useHeaderBehavior.ts` measures the real header height and handles directional hysteresis. It does not register a scroll listener on commerce routes. Open menus/dialogs and keyboard focus temporarily keep an eligible revealed header available.

A measured header slot avoids shifting the page when eligible routes switch between flow and reveal. Re-entering a commerce route immediately restores the normal header.

## Changed-code locations

- `src/views/Catalog.tsx`: listing structure, supported filters, grid buttons.
- `src/hooks/useCatalogGrid.ts`: responsive density preference.
- `src/components/Layout.tsx`, `src/hooks/useHeaderBehavior.ts`: header.
- `src/components/ProductGallery.tsx`, `src/components/Photo.tsx`, `src/lib/media.ts`: photo fitting, source metadata, explicit zoom.
- `src/components/StyleOptionImage.tsx`, `src/lib/style-preview.ts`: collar imagery.
- `src/views/Product.tsx`: style image component and reference description.
- `src/app/fonts.ts`, `src/styles/globals.css`: typography and layout.
- `src/lib/server-catalog.ts`: forward the supported sale-only filter.
- `src/data/demo.ts`: correct zero-valued maximum-price handling.

## Apply this ZIP

1. Back up or commit the existing storefront.
2. Open this `threazle-storefront` folder as the project root. Do not layer the whole folder as a nested app inside the old root.
3. Preserve your existing `.env.local` and Vercel public environment settings.
4. Run `npm install` to install the new display-font package and existing dependencies.
5. Run `npm run typecheck`, `npm test`, `npm run build`.
6. Install Playwright Chromium and run `npm run test:e2e`.
7. Validate against the staging backend using `docs/LIVE-ACCEPTANCE.md`. Deploy only after the build and real flows pass.

The runtime browser state and APIs were not replaced with static screenshot markup. Static inspection artifacts are not part of the shipped application.

## Remaining limitations

This is a source-code update, not certification that every interaction is production-ready. Dependencies could not be installed in the preparation environment. See `VERIFICATION.md` for tests actually run versus the full Next.js/browser/live-backend checks still required. Existing backend-level blockers remain documented in `BACKEND-BLOCKERS.md`. Product and style photographs still need business approval before being presented as the exact goods for sale.
