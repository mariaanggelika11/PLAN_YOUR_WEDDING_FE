# Frontend UI redesign

## Scope and audit

Audit baseline: `8a5a922` (Integrasi crud notifikasi). Reviewed the frontend architecture and indexed all 179 files under `src` before editing. The implementation changes presentation only.

- **Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Lucide icons, Radix Dialog/Slot. Existing libraries retained; no new dependency.
- **Routing:** public/auth pages and customer/vendor/admin catch-all routes. Feature resolvers and role permissions retained.
- **Layout:** `PublicNavbar`, `AuthPageLayout`, `AppShell`, `FeaturePage`, profile step sections.
- **Shared UI:** buttons, icon buttons, native form fields/date input, tables, tabs, stepper, cards, status badges, popup confirmations, loading/error/empty states.
- **Feature coverage:** dashboards, marketplace/product/vendor details, checkout, orders/payments/reviews, profiles/uploads/map picker, wedding planning/templates/tasks, budget, notifications, admin management/verification/parameters/reports.
- **Data boundary:** service/repository/API modules, validation, authentication, middleware, state hooks, formatters, PDF generation, and dictionaries remain unchanged.

Main inconsistencies found: oversized radii/shadows, decorative hover movement and gradients, competing card treatments, missing customer page titles, cramped header controls, inconsistent pagination, and grid content that could exceed small viewports.

## Design decisions

| Element      | Treatment                                                          |
| ------------ | ------------------------------------------------------------------ |
| Canvas       | Warm off-white `#FAFAF8`                                           |
| Surface      | White with a subtle neutral border                                 |
| Text         | Charcoal `#292524`, warm gray secondary text                       |
| Primary      | Dusty rose `#945565`; quieter rose scale                           |
| Gold         | Existing brand mark and restrained champagne accent                |
| Typography   | Existing system sans; regular/medium/semibold, clear heading scale |
| Radius       | Controls 8 px, cards 12 px, dialogs up to 16 px                    |
| Shadows      | Subtle surface shadow; deeper shadow reserved for overlays         |
| Spacing      | 16 px mobile, 24 px tablet, 32 px desktop content inset            |
| Focus/motion | Visible keyboard focus, reduced-motion support, color transitions  |

The desktop sidebar is 256 px, scrolls when necessary, and preserves its collapse behavior. Page titles sit in the content area; the top bar contains account controls. Mobile navigation respects the safe area. Notification dropdowns fit the mobile viewport.

Auth pages share a quiet branding panel on desktop and a focused form on mobile. Existing field names, validation, submissions and authentication flow are unchanged.

Tables retain horizontal scrolling. Pagination uses compact chevrons with accessible names and the existing page calculations/callbacks. Modal height and internal scrolling accommodate small screens. Long profile/detail fields and nested grids can shrink without widening the page.

## Regression verification

- `npm test`: all 32 existing tests pass.
- `npm run typecheck`: passes.
- `npm run build`: production build passes.
- AST comparison against the pre-redesign source: unchanged non-JSX logic after excluding presentation style expressions, imports and formatting. Existing event handlers, field bindings/constraints, routes, image sources, refs, keys and visibility props were compared separately.
- No changes to `.ts` files under `src`, API URLs, request payloads, repositories, permission rules, calculations, authentication, sorting/filtering, or pagination calculations.
- Browser tests use intercepted API fixtures and isolated local sessions. No real backend records are created, changed or deleted.

### Browser results

Chrome local production preview: **45 routes × 7 viewport widths = 315 layout checks** at 320, 375, 390, 768, 1024, 1280 and 1440 px. Three table pages were rechecked in all seven sizes after fixing an absolutely positioned, visually hidden toggle input. All checked pages now fit the viewport; table contents scroll inside their container. No page runtime exceptions remain with the test fixtures.

Interaction checks passed:

- Login required-field validation, password visibility, encrypted request, role redirect, logout/session removal.
- Customer and vendor registration through OTP verification.
- Marketplace search, sorting, filter dialog, and mobile notification dropdown bounds.
- Task pagination and edit submission with the existing payload; actual PDF download.
- Profile photo selection/preview; vendor product multi-step form.
- Vendor product search and delete confirmation cancellation.
- Admin parameter creation and adding/removing detail inputs.
- Customer/vendor notifications: pagination, read filters, single/all mark-read, failed write recovery, and bell synchronization.

Screenshots of auth, dashboards, marketplace, planning, profile and admin tables were inspected. Browser fixtures are isolated under `/tmp/pyw-notifications-browser`; screenshots and layout reports are under `/tmp/pyw-ui-review` and are not application assets.

Limitations: browser execution was in Chrome only. Safari, Firefox and Edge have not been run. Deployed-backend transactions, every possible record/status combination, and delivery of real OTPs were not exercised. These checks do not replace end-to-end testing against the deployed backend.

## Existing issues outside this redesign

1. Public featured content and several customer/vendor/admin dashboard statistics still use mocks. The customer dashboard countdown/progress values are hardcoded. Budget and some admin reporting/monitoring screens also contain sample data.
2. The shared table filter button has no existing filter action. It has been preserved, not connected to a new behavior.
3. Some marketplace save/chat/share and admin sample actions are presentation placeholders.
4. Order Assistant explicitly remains a UI preview with no AI backend.
5. Global popup confirmations retain their existing lifecycle; a future accessibility behavior task should review focus trapping/restoration and keyboard dismissal.
6. Routes such as settings that currently resolve to the fallback screen have not been implemented as new features.

These are not repaired here because doing so would change application behavior or require backend work.

## Header follow-up

At the user's request, the desktop collapse control now lives in the header, with a hamburger to expand the compact sidebar. The header shows the active navigation context and quieter language/notification/account controls. Mobile drawer state now closes on navigation (including the current page), Escape, its close button, or a resize to desktop. This explicitly requested UI interaction change does not change API/authentication or role routing.

Validated customer, vendor and admin: collapse/expand, seven viewport widths, mobile drawer opening/closing, Escape and focus restoration, navigation dismissal and desktop resize. Typecheck and production build pass.

## Customer/vendor order layout follow-up

Customer detail rows were stretched to match the adjacent timeline, whereas the vendor page stacked separate full-width cards. Both now use `OrderOverview`: a compact event detail and payment summary column, alongside the timeline on wide screens, stacking on smaller screens. `DetailGrid` uses intrinsic row heights and start alignment. Payment figures use two readable columns within the narrower summary card. Existing role-specific fields, payment calculations, timeline events and action handlers remain intact.
