# Verification — v2.3, current delivery

## Executed

| Check | Actual result |
|---|---|
| Core commerce / mocked HTTP adapter source checks | 66 passed |
| Existing grid, header, media and UI helper checks | 41 passed |
| New audit regression checks | 46 passed |
| Total source tests | **153/153 passed** |
| TypeScript syntax transpilation | 95 application files and 2 browser-spec files; no syntax errors |
| Internal import paths | 277 resolved |
| CSS source parsing | Both files passed; not a built Tailwind bundle |
| WebP decoding | 151 passed |
| Static mobile/desktop source specimens | 36 across 320/375/390/430/768/1440px; no measured header overlap or document overflow |

## Not executed / not established

`npm ci` could not complete because dependencies were inaccessible. Offline retry returned ENOTCACHED. No claim is made for vendor type-checking, Next.js build/runtime, React hydration, the real Playwright suite, live Supabase/API access, real orders, database transactions, PSP payments, load testing or WCAG compliance.

The included 16 Playwright scenarios are test definitions, not a passing report. They run under desktop and mobile projects after dependency installation.

## Static-preview method

Actual source JSX was rendered with small hook stubs and plain Link/Image adapters. Effects, app event handlers and hydration did not run. Chromium rendered isolated local specimens with the existing CSS, v2.3 overrides, representative icon paths, embedded supplied photographs and fallback system fonts. A preview-only CSS reset was used; the actual project retains its existing Tailwind 3 dependency. Native dialog dimensions were checked, not full modal workflow execution.

These are layout specimens, not screenshots of a Next production build. They cannot establish hover timing, route transitions, real keyboard/focus behavior, scroll-reactive effects, payment success or API correctness.

## Re-run on your machine

```bash
npm ci
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Preserve your `.env.local`. Follow `LIVE-ACCEPTANCE.md` against staging for the actual backend. Current evidence is under `validation-v2.3/`; older reports are explicitly historical.
