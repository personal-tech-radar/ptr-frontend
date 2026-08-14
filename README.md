# Personal Tech Radar frontend

Angular 21 standalone application for Personal Tech Radar. It uses server-side rendering and client hydration for public signals, authentication, onboarding, the personalized radar, and profile management. Administrative UI is intentionally out of scope.

## Requirements

- Node.js 20.19+, 22.12+, or 24+
- npm 10+

## Development

```bash
npm install
npm start
```

The development server is available at `http://localhost:4200`.

## Verification

```bash
npm test
npm run lint
npm run format:check
npm run build
```

Run the production SSR output after a successful build:

```bash
npm run serve:ssr:ptr-frontend
```

The SSR server listens on `PORT`, defaulting to `4000`.

The frontend API boundary is served by the Angular Express host. Configure it with:

```bash
PTR_BACKEND_URL=http://127.0.0.1:3300 \
PTR_BACKEND_API_KEY=your-public-api-key \
npm run serve:ssr:ptr-frontend
```

`PTR_BACKEND_API_KEY` is only read by the server and is never included in browser bundles. The proxy rejects `/admin/**`. Development requires the backend live OpenAPI contract at `http://localhost:3300/docs-json`.

## Architecture

```text
src/app/
├── core/       application-wide infrastructure and services
├── features/   lazy product features
│   └── <feature>/
│       ├── domain/  framework-independent models and rules, when needed
│       ├── data/    API access and DTO mapping, when needed
│       └── ui/      pages, components, and feature state
└── shared/     reusable presentation, directives, pipes, and styles
```

Do not create empty architecture layers. Start locally and introduce a boundary only when a feature has the corresponding responsibility.

The project intentionally has no UI component library or CSS framework. Components use semantic HTML, scoped SCSS, accessibility-first interactions, and shared CSS custom properties for design tokens.

## Server rendering

Angular SSR is configured through `src/main.server.ts`, `src/server.ts`, and `src/app/app.routes.server.ts`. Routes currently render on demand on the server. Browser-only APIs must remain behind platform-safe boundaries so server output and hydrated client output stay equivalent.

Public landing and signal data are server rendered through the protected API boundary. `/radar` server renders its stable shell and feed skeleton, then loads personalized data after browser hydration. Public HTTP responses use Angular's transfer cache to avoid an immediate duplicate hydration request.

## Authentication

Access tokens live in application memory. Rotating refresh tokens are held in browser `sessionStorage`, restored once per tab, and coordinated through a single shared refresh request. They are not placed in `localStorage` and cannot execute during SSR. This matches the current backend body-token contract; an HttpOnly same-site refresh cookie issued by the backend would be the preferred future hardening.

## Routes

- `/` public radar preview for guests; authenticated users continue to `/radar`
- `/register`, `/login`, `/verify-email`, `/forgot-password`, `/reset-password`
- `/onboarding`, `/radar`, `/profile` (authenticated)
- `/signals/:id` public SSR signal page
- `/info/:id` public SSR information page linked from the footer

SSR host validation currently allows `localhost` and `127.0.0.1`. Add each deployed public hostname to `projects.ptr-frontend.architect.build.options.security.allowedHosts` during deployment configuration; do not use a wildcard in production.

## Email verification links

Verification emails must link to the frontend callback, not directly to the backend:

`http://localhost:4000/auth/verify-email?token=<verification-token>`

Set the backend `APP_URL` to the public frontend origin. Its generated `/auth/verify-email?token=...` link lands on this SSR-safe frontend callback, which consumes the token through `GET /auth/verify-email`, refreshes the registered user's session state, and continues to `/onboarding`. `/verify-email?token=...` remains available as a compatibility alias.

Run `npm run smoke:registration` with the frontend, backend, and local mailbox running to verify registration, the delivered email link, onboarding continuation, and authenticated redirects in a real browser.
