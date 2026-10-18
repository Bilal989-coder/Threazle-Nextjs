# Threazle Phase 2 — frontend

This is the corrected integration source candidate from 15 October 2026, not a verified public deployment. Read `../START-HERE.md`, `../VERIFICATION-REPORT.md` and `../PHASE1-UAT.md`. Extract all three packages together so the shared setup/test tools are present.

The storefront and admin use Supabase Auth and the Express API. The API uses your Supabase PostgreSQL database and Storage. The default release is API-only and cash-on-delivery-only. No sample merchandise, fabricated orders or preset administrator passwords are created.

Configuration is generated from your original `backend_env` file by `node setup.mjs` in the shared parent folder. Do not put server credentials in this app’s public configuration. Existing uploaded history and legacy tests are reference material, not current acceptance evidence.
