# Plan Your Wedding — Android

Native Android application built with Expo SDK 58, React Native and TypeScript. The existing Next.js website stays separate. Both clients use the same backend; no backend endpoints or web business logic are changed.

Navigation uses Expo Router with file routes under `src/app`, a protected authenticated stack, role-specific tabs, and a role guard on detail routes. Non-route components and services stay outside `src/app`.

The public entry now has the same content structure and brand assets as the website: a bundled wedding photograph, vendor discovery CTA, how-it-works steps, and customer/vendor registration choices. Signed-in users continue directly to their role dashboard. Phone navigation uses a compact branded header, a dismissible hamburger drawer, and primary bottom tabs. At 900dp and above, the authenticated workspace switches to a permanent sidebar; public navigation expands at 1000dp when the font size allows it.

The customer dashboard adds the existing wedding profile's countdown, date/location and four feature shortcuts. Missing profiles offer completion; profile errors can be retried without hiding order activity. Vendor/admin dashboards keep their own live summary and permitted shortcuts. Shared cards, typography, form focus states, touch targets, keyboard handling and font-aware grids are used throughout the native screens. Language switching preserves the active form draft. Text fields include bilingual, field-specific examples and persistent guidance for passwords, money, addresses and other formatted inputs. Examples are placeholders and never become submitted values. The API contracts and transaction handlers remain unchanged.

## Run

Use the repository's Node.js 24 version. From the repository root:

```sh
npm ci
cd mobile
npm ci
npm start
```

Open the project using a compatible Expo Go installation, or run `npm run android` with Android Studio and an emulator/device. Copy `.env.example` to `.env` to point to a staging backend. Android calls an absolute HTTPS backend URL directly; the website's `/backend-api` rewrite does not run inside the Android app. Android emulator local development can use `http://10.0.2.2:<port>` in a debug build.

The mobile package has its own dependencies/lockfile. The root TypeScript and ESLint configurations exclude `mobile`; mobile checks run separately. Shared API types and the complete-pagination helper are consumed directly from `../src`, so keep this package inside the repository.

## Implemented flows

| Role     | Native screens and operations                                                                                                                                                                                                                                                                |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All      | Login, remember session, logout, Indonesian/English preference, customer/vendor registration, terms consent, OTP verification/resend and password recovery                                                                                                                                   |
| Customer | Dashboard, marketplace search/sort/filter, package/store/portfolio/reviews, date availability, checkout, orders, payment-proof upload/history, cancellation/disputes/completion, order chat/images, reviews, profile/wedding basics, budget, preparation tasks/settings, notifications       |
| Vendor   | Dashboard, own package create/edit/draft/publish/delete with verified-account gating, order acceptance/rejection/start/delivery, payment verification through orders, marketplace browsing, reviews, business profile, contacts, bank accounts, verification documents and portfolio uploads |
| Admin    | Dashboard, user activation, vendor directory and verification queue, vendor document review/approval/rejection, payment review, product/order/review monitoring, dispute resolution, parameter/detail management and terms version creation/activation                                       |

Reports and audit logs show the same unavailable state as the web application because the web does not have backend implementations for those screens. This first native implementation does not reproduce every advanced web editor: map picking, PDF planning export, richer customer profile preferences and multi-photo editors still need dedicated mobile UX. Notifications use the existing API; push delivery needs backend/FCM integration separately.

Registration terms follow the website interaction: a customer/vendor link opens a full-screen, scrollable document reader with version/effective date, labelled table cards on phones, fluid tables on wider screens, aligned clause numbers, a close control and a return-to-registration button. Consent remains a separate checkbox on the form; opening or closing the document never grants consent. Updated terms for signed-in users appear in a blocking dialog with explicit acceptance or sign-out, and every pending version starts unchecked. Legal content and accepted version IDs still come from the existing backend API.

## Requests and session handling

Passwords follow the existing `/cryptography/encrypt` and encrypted login/registration/reset payload contracts. The primary backend role determines navigation; the app never lets a user choose a role to grant access. Native token persistence uses Expo SecureStore (Android Keystore-backed encryption), not AsyncStorage. Non-remembered sessions stay in memory. Expired/401 sessions leave protected screens and return to the public entry, which provides sign-in; 403 responses retain the session. AsyncStorage holds the language preference only.

The API client applies 30-second deadlines, or 120 seconds for multipart uploads, and never automatically retries mutations. User-visible errors use stable translated messages rather than raw server responses. Android file URI uploads preserve backend form field names. Payment proofs accept JPEG/PNG/PDF up to 5 MB. Both the UI and backend must enforce ownership and permissions; mobile route guards do not replace backend authorization.

The existing Next.js Sentry integration does not monitor React Native. Native screens have recovery UI, but a separate React Native Sentry integration/DSN would be required for remote Android crash reporting.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run test:native
npm run bundle:android
```

Pure tests check the backend payloads, token handling, deadlines, no-retry behavior, file restrictions and payment-rule parity against the website. React Native component tests use an in-memory API fixture and make no requests to the production backend. These checks are distinct from device testing and staging acceptance with real test accounts.

Local verification: 17 pure tests and 36 native component tests pass, along with TypeScript, lint and Android bundling. The dependency set previously passed all 20 Expo Doctor checks and is unchanged by this UI update. Android API 37 emulator checks cover the public landing, login, drawer dismissal with Android Back, 320dp screens, 150% text size, and the 1024dp tablet sidebar. Customer/vendor/admin dashboards were inspected with fixture accounts in a separate temporary emulator. The final standalone APK also passed cold start, bilingual landing, login, drawer dismissal and tablet login checks. Dashboard screenshots in `artifacts/ui-preview/` contain demonstration data. These checks do not replace staging acceptance on physical devices.

The dependency audit currently reports low-severity Deepmerge/Jest advisories through testing packages (including an optional Router testing peer). These modules are absent from the Android release bundle's source list. Keep the audit visible and adopt compatible upstream fixes when available; forced tooling downgrades are not applied. CI blocks moderate-or-higher advisories.

## Local preview APK

```sh
npm run build:apk
```

This generates the Android project and runs Gradle locally. Android Studio's JDK and Android SDK must be available. The script detects their standard macOS locations; other installations can set `JAVA_HOME` and `ANDROID_HOME`. Gradle may download required Android NDK/build components on the first build.

The output is `artifacts/plan-your-wedding-preview.apk`, containing its JavaScript bundle and using the local debug signing key. It defaults to **arm64-v8a** devices; set `PYW_ANDROID_ABIS=arm64-v8a,x86_64` for an additional emulator architecture. This preview artifact is for installation/testing, not Play Store publication. The provisional application ID is `com.planyourwedding.app`.

For a Play Store release, confirm the final application ID, configure privately owned signing credentials, build a signed AAB and complete real-device/staging acceptance. EAS can be added later; the local preview build does not require an Expo account or upload project files to Expo.
