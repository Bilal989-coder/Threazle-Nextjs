> v2.3: these remain server-side launch gates. No backend code was changed. See `CLIENT-REQUIREMENTS-AUDIT.md` for the requirement-level assessment.

# Backend review required before live launch

These findings come from the supplied `Threazle-main` source. They are not claims that a deployed service was penetration-tested. The backend has not been changed in this storefront ZIP.

## Launch gates

1. **Select the real backend architecture.** This source is Supabase/PostgreSQL + Prisma, not the previous MariaDB SQL installer. Confirm migrations, RLS/profile provisioning, storage permissions, secrets and environment before integrating.
2. **Install and build the actual project.** Dependencies could not be downloaded in the editing environment. Run the full TypeScript, Next production build and browser suites, use the supplied lockfile, and review the dependency audit.
3. **Provision actual content and assets.** `Threazle-main.zip` contains only three PNG logo/icon assets. Its product-image backfill script references missing files from a developer-local location. Upload correctly licensed product/fabric photography and publish real descriptions/prices/availability. Do not reuse unrelated sample photography as live catalog records.
4. **Enforce configuration eligibility server-side.** `pricing.service.ts` validates a fabric's category compatibility, but product-level fabric assignment and add-on assignment need a complete authoritative check. The storefront restricts selections but client validation is bypassable.
5. **Bind idempotency to the request.** `order.service.ts` reuses an existing idempotency key without a full canonical request-fingerprint match. Store a hash, reject changed-payload reuse, and review guest replay ownership/privacy. The client keeps a stable key and locks unresolved retries, but cannot secure a malicious direct request.
6. **Handle uncertain order results operationally.** A timeout can happen after the backend commits. Retrying the unchanged submission uses the same key. Provide a support/reconciliation process before clearing an unresolved key. Do not tell a customer to place another order blindly.
7. **Finalize guest order authorization.** The current UUID is a bearer capability. Add verified, expiring guest access when appropriate and avoid exposing private references in analytics or referrers. Client noindex is not authorization.
8. **Finalize fabric costing/consumption.** The price service adds a fabric price once, even where the catalog label is per-meter/per-suit. Resolve actual consumption quantity, units, stock and included stitching rules before accepting custom garment orders. The storefront mirrors source quotes rather than inventing a replacement pricing formula.
9. **Protect combined discounts and rewards.** Verify server-side combined coupon plus loyalty never exceeds the eligible subtotal; enforce redemption and refund/reversal rules atomically. Client preview blocks an excessive total but is not the final security boundary.
10. **Verify transactions against the real database.** Test competing purchases of the last size, coupon limits, inventory updates, idempotent duplicate submits, cancellation and rewards concurrently. Utility tests with mocked fetch do not prove these database properties.
11. **Publish policy and support configuration.** Missing shipping, returns, privacy, contact and measurement instructions deliberately render an honest unavailable state. Complete these before indexing/marketing. Confirm approved lead times and the correct distinction between body and garment measurements.
12. **Confirm real authentication.** Email confirmation, recovery callback allowlists, SMTP settings and production account provisioning must work. Never run demo credential seeds on a production database. Test customer-vs-staff identity and another customer's private record denial.
13. **Email forms are not delivery infrastructure.** The reference forms service records pending notifications. Add/configure the provider, consent, retention and newsletter opt-out workflow before presenting a live marketing program. This UI only says a request was received.
14. **Payment scope is COD only.** Enabled methods come from the supplied endpoint. No online payment provider has been activated. Do not enable card/wallet buttons without a real server/provider integration and webhook verification.

## Explicit current limitations

- Order progress is whole-order, not per-line tailoring or split-shipment tracking.
- The public API does not provide every filter from the earlier BRD. Unsupported filters are not silently simulated.
- There is no public review API in this reference, so the site does not display invented verified reviews.
- Error pages, content sanitization, media allowlists and security headers help but do not amount to a security audit. Establish CSP, logging/redaction, rate limits and a retention policy appropriate to the final hosts and services.
- No production URL has been modified or deployed by this deliverable.
