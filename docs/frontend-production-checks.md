# Frontend production checks

The checks below cover the frontend. They do not certify backend authorization, database migrations, email delivery, refunds, or production infrastructure.

## Runtime and reproducible installation

Use Node.js 24 (`nvm use`) and install the committed lockfile with `npm ci`.

Next.js stays on major 15. Security overrides upgrade DOMPurify, Sharp, PostCSS, Nanoid 3, source-map-js, and modern minimatch. The minimatch override applies only to versions 7–10; older consumers retain their compatible API. Keep these overrides until the upstream ranges include patched releases. After changing them, rerun lint, unit tests, build, browser tests, and both dependency audits.

## Commands

```sh
npm ci
npm audit --omit=dev
npm run check
npx playwright install chromium
npm run test:e2e
npm run build:e2e:monitoring
npm run test:monitoring
```

`npm run check` runs ESLint with zero warnings, translation checks, unit tests, an isolated production build, TypeScript, and initial JavaScript size budgets. Browser tests require `npm run build:e2e` and start a temporary server on `127.0.0.1:3107`. The `.next-e2e` and `.next-e2e-monitoring` directories keep test builds separate from a running development server. Close any other server on port 3107 first. `npm run build` and `npm start` retain the normal deployment build and port 3003. Never deploy an E2E build: its backend destination deliberately fails closed.

The GitHub Actions workflow repeats these checks on pull requests and main/master pushes, runs Chromium in desktop and mobile viewports, checks bundle budgets, and tests enabled monitoring using a fake DSN intercepted locally. It retains screenshots/traces for failures. It uses a non-routable backend destination and fixture responses. It does not deploy the application. Require the `verify` job in branch protection using repository settings if releases should be blocked on failures.

## Browser coverage

Tests cover Indonesian/English pages and metadata, saved language preferences, form draft preservation across language changes, registration consent gating, login errors/retry, protected-route redirects, customer/vendor/admin dashboards, order labels and original vendor data, marketplace sorting API values, error/retry, request timeout, 401 session expiry, 403 access denial, error boundary recovery, checkout availability and request payloads, payment proof validation/upload, and vendor payment confirmation.

All backend requests are intercepted in `e2e/fixtures.ts`. Unexpected mutations fail closed with HTTP 405; tests never create real accounts, orders, or payments. Fixture tests check frontend behavior against the expected contract, not real backend security or database transactions. Run staging UAT separately with test accounts before a public release.

## Translation maintenance

Interface messages live in `src/shared/i18n/messages/{id,en}.json`; small validation and error namespaces live in separate files in that directory. The server sends the selected catalog and a language change loads the other catalog on demand. Both locale and messages change together, preserving mounted form drafts. A failed language download leaves the current language intact and shows retry feedback. Add new interface copy using stable keys and `t(key)`. `textKeys.ts` is a compatibility index for existing `translateText` callers. `npm run test:i18n` checks matching keys, ICU formatting, placeholders, literal translation calls, and untranslated interface sources.

Vendor names, descriptions, user notes, backend document content, and custom task text remain data. Built-in planning template copy is translated only when it matches the recognized template; localized rendering never overwrites saved titles, notes, enum values, payment types, or form payloads.

## Errors and deadlines

API requests have a 30-second deadline and multipart uploads have 120 seconds. Deadlines include reading the response body. Existing caller cancellation and shorter caller deadlines are preserved. Mutations are never automatically retried. A timeout can occur after the server committed an action, so feedback tells users to check current status before repeating it.

Application errors, root-layout errors, loading, and missing pages have localized fallback screens. Raw exception messages and stacks are not displayed. An available digest is shown as a reference code. Error boundaries can reset rendering without replaying a mutation.

Authenticated attachments use a shared native image component because browser-owned blob URLs cannot be fetched by Next.js image optimization. Public site imagery continues to use the existing Next.js image setup.

## Mobile and accessibility

Automated axe checks cover the home, login, registration, password recovery, customer dashboard/order/checkout/marketplace, and vendor/admin dashboard pages in desktop and mobile Chromium. Checks use WCAG 2 A/AA, 2.1 A/AA and 2.2 AA rule tags. Additional browser tests exercise 320px layouts in both languages, keyboard scrolling of tables, the skip link, form descriptions, mobile drawer focus trapping/Escape/focus restoration, account popover dismissal, and keyboard-operated store tabs.

Shared inputs use explicit labels, stable IDs, descriptions and announced errors. Tables expose column headers and a focusable scroll region. Mobile navigation exposes its current page. Secondary text, placeholders, badges and mobile drawer labels use stronger contrast. Tabs support arrows/Home/End, and accordion buttons identify their controlled content. Reduced-motion preferences continue to be respected.

Automated rules cover only the tested fixture states. Before release, also check real-device Safari/Chrome, zoom and a screen reader with the actual staging content.

## Performance

Customer, vendor and admin features load by page, so dashboards no longer include every management screen in their initial bundle. Locale catalogs load on demand; API validation and fallback errors import only their small namespaces. Leaflet styles load with the map. Public Next Image components specify responsive sizes. Existing lazy map/PDF loading is preserved.

The local production build reported the following initial JavaScript sizes with monitoring disabled:

| Route    | Before points 6–8 |  After |
| -------- | ----------------: | -----: |
| Home     |            237 kB | 183 kB |
| Customer |            314 kB | 159 kB |
| Vendor   |            300 kB | 159 kB |
| Admin    |            271 kB | 159 kB |
| Login    |            245 kB | 191 kB |

These are Next.js build statistics for initial route code, not total session downloads or measured LCP/INP. Feature chunks still load when their page renders. `npm run test:performance` separately sums gzip bytes of every unique initial script in each route plus the root layout and fails on its documented budget. Run it after `build:e2e`, or pass a normal production directory with `node scripts/check-performance.mjs .next`. Its accounting differs from Next's summary, so the two sets of numbers should not be compared directly. Measure Web Vitals against the deployed staging site and representative devices before setting a user-experience claim.

## Optional Sentry error monitoring

Monitoring is disabled by default. **DSN is the Sentry project's error-ingestion address; it is unrelated to DNS, the domain name, or the hosting/deployment URL.** No Sentry project has been created and no real DSN has been configured by this change.

To activate it on existing hosting:

1. Create/select a Next.js project in Sentry and copy its DSN from project settings.
2. Set `NEXT_PUBLIC_SENTRY_DSN` in the hosting environment **before the production build**. Optionally set `SENTRY_DSN` before build as well for Next.js Node server errors. Empty DSNs disable the corresponding integration. Edge middleware does not initialize Sentry, keeping its authentication path lightweight.
3. Set `NEXT_PUBLIC_SENTRY_ENVIRONMENT` and `NEXT_PUBLIC_SENTRY_RELEASE` (for example a commit SHA). Rebuild and deploy using the normal production commands.
4. In staging, trigger a controlled error and verify that Sentry receives an event with the expected release, route and stack location. Configure the project's alert rule and recipients in Sentry; alert delivery requires that account configuration.

Browser exceptions, unhandled promise rejections, React error boundaries and API availability failures can be reported. API reporting ignores expected 4xx responses and caller cancellations, and deduplicates each failure/status category for 60 seconds without retrying requests. SDK loading and reporting failures do not block the existing UI error/retry behavior. No SDK initializes or sends events without its DSN.

Events use an allowlist: route structure (resource IDs/queries removed), release/environment, fixed exception descriptions, exception type and compiled stack location. User data, raw error/response messages, bodies, headers, cookies, breadcrumbs and arbitrary context are omitted. This deliberately limits diagnostic detail to avoid sending wedding/customer/payment data. Replay, tracing, logs, automatic sessions and SDK telemetry are disabled. Review project retention/access settings when activating your account.

For readable stacks, optionally enable private source-map uploads with `SENTRY_UPLOAD_SOURCEMAPS=true`, `SENTRY_ORG`, `SENTRY_PROJECT`, and a secret `SENTRY_AUTH_TOKEN` available only in the trusted build. Never prefix that token with `NEXT_PUBLIC_` or commit it. Uploading remains disabled unless all prerequisites are present.

`build:e2e:monitoring` embeds a fake DSN on the reserved `.invalid` domain. `test:monitoring` intercepts transport locally, verifies real SDK envelopes, redaction and API deduplication, and sends no events to a live Sentry account. The test wrapper clears real credentials and source-map upload settings.

## Release limits

These changes do not replace backend JWT/role/ownership validation or move access tokens out of browser storage. Those require a coordinated backend authentication change. GitHub workflow execution, staging transactions, accessibility testing beyond the browser scenarios, deployed Web Vitals, and activation/alert delivery for real production monitoring still need their own verification.
