# Asset provenance and image handling

## What was actually provided

The uploaded `Threazle-main.zip` includes three raster assets under `frontend/public`: `logo-mark.png`, `apple-touch-icon.png`, `favicon.png`. Its scripts mention product images, but those source product files are not in the archive. Do not describe this delivery as converting a full product-photo collection from the main ZIP.

Those three PNGs were converted losslessly to WebP and verified for format/dimensions. `asset-conversion.json` lists each original path, target path, dimensions, source/output size and SHA-256. Original combined size: 213,883 bytes. WebP combined size: 129,570 bytes (approximately 39.4% smaller). Real compression varies by asset.

The supplied Next.js storefront already contains WebP product/editorial images. These are retained for explicit preview fixtures and editorial design; the real API catalog uses each actual backend image URL. No filename guessing maps main-backend products to unrelated photos.

The original `images.generated.ts` dimensions/variants remain available for editorial assets. Next's image optimizer now serves correctly sized remote/local responsive images in WebP/AVIF on a normal server deployment. A neutral SVG placeholder is shown for absent or unapproved-host media.

## Add the missing real photographs

1. Obtain the correct approved/licensed original files for each real product and fabric.
2. Convert with:

```bash
npm run images:convert -- --source ../YOUR_IMAGE_FOLDER --output public/converted
```

3. Inspect output and `conversion-manifest.json`. The script rejects collisions and existing outputs unless `--overwrite` is supplied. It never modifies originals, and strips image metadata through conversion.
4. Upload the correct output to the reference backend's configured storage/admin media flow; update the matching product record URLs.
5. Allow the exact storage/CDN hostname in the storefront environment when it is not already the Supabase host.

Converting a file does NOT update product records. Server-side uploads/transformation settings are separate from this customer storefront.

## Licensing and platform notes

The uploaded files establish availability, not independent proof of commercial image rights. Confirm permission before public use. No third-party product images were downloaded or invented during this update. No font binaries are included; fonts are installed from the declared Fontsource npm packages and self-hosted by Next during the build.

The Apple touch icon is delivered in the requested WebP format alongside favicon/brand WebPs. For a final installed iOS home-screen experience, verify device support and provide an appropriately sized PNG touch-icon derivative if required; this does not change WebP use for the storefront images.


## UI revision 2.1 — collar references

Three different close-ups were cropped from existing supplied WebP photographs, not downloaded from third-party stock sites. Each is supplied at 160, 320 and 640 square pixels in `public/images/details/`. See `collar-image-sources.json` for original paths and crop coordinates. Source-photo ownership/licensing has not been independently established.

These are explicitly labelled shape/finish references. They are not a guarantee of the exact garment colour, material or bespoke outcome. A unique, valid style-specific image returned by the backend is preserved. Known collar labels with missing, repeated or full-product images use the matching reference crop. Unknown style labels are not assigned guessed imagery.

Product photographs are displayed within a common 3:4 frame using `object-fit: contain`. The originals are not stretched or destructively recropped into a new aspect ratio. The manifest resolver recognizes existing derivative filenames and selects the highest-resolution source; Next/Image then serves the responsive display sizes. Full-screen detail uses the original available source and caps enlargement at native pixel detail.
