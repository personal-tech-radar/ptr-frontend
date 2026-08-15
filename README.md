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

SSR host validation allows `localhost`, `127.0.0.1`, and the production apex `personalradar.dev`. Do not use a wildcard in production.

## Email verification links

Verification emails must link to the frontend callback, not directly to the backend:

`http://localhost:4000/auth/verify-email?token=<verification-token>`

Set the backend `FRONT_APP_URL` to the public frontend origin. For local development it must be `http://localhost:4000`, not HTTPS, because the local SSR server does not terminate TLS. The generated `/auth/verify-email?token=...` link lands on this SSR-safe frontend callback, which consumes the token through `GET /auth/verify-email`, refreshes the registered user's session state, and continues to `/onboarding`. `/verify-email?token=...` remains available as a compatibility alias.

Run `npm run smoke:registration` with the frontend, backend, and local mailbox running to verify registration, the delivered email link, onboarding continuation, and authenticated redirects in a real browser.

## Continuous integration and deployment

Pull requests run unit tests, ESLint, and Prettier checks on Node.js 22. The production workflow is started manually in GitHub Actions. It repeats the tests, publishes `prod` and commit-SHA Docker image tags to Docker Hub, and triggers the Dokploy deployment webhook.

Add these GitHub Actions repository secrets:

- `DOCKERHUB_USERNAME` — Docker Hub account used to publish the image.
- `DOCKERHUB_TOKEN` — Docker Hub access token with permission to push the image.
- `DOCKERHUB_IMAGE` — full Docker Hub image name, for example `personaltechradar/ptr-frontend`.
- `DOKPLOY_WEBHOOK_URL` — private Dokploy deployment webhook invoked after the image is published.

Configure these runtime environment variables in Dokploy, not as Docker build arguments:

- `PTR_BACKEND_URL` — backend origin reachable from the deployed frontend container.
- `PTR_BACKEND_API_KEY` — API key used only by the SSR server for protected public API requests.
- `PORT` — internal Angular SSR port; keep the default `4000` because Nginx proxies to it inside the container.

## Production edge and traffic filtering

The production container runs Angular SSR on its internal port `4000` and Nginx on the exposed port `80`. Supervisor keeps Angular SSR, Nginx, and the daily logrotate scheduler running. Configuration is kept under `deploy/`:

- `deploy/nginx` — separate main, upstream, virtual-host, and proxy-header configuration plus static-asset caching, rate limits, and common scanner-path rejection.
- `deploy/logrotate` — daily Nginx log rotation with a 14-file retention limit and early rotation at 25 MB.
- `deploy/fail2ban` — host-side filter, jail, and Docker firewall action for repeated scanner requests and API rate-limit violations.
- `deploy/supervisor` — process supervision inside the container.

In Dokploy, route both `personalradar.dev` and `www.personalradar.dev` through Traefik to container port `80`. Traefik exposes public ports `80` and `443` and terminates Let's Encrypt TLS. Nginx permanently redirects `www.personalradar.dev` to `https://personalradar.dev` and forwards the original scheme and client address to Angular SSR.

Persist Nginx logs with a host bind mount:

```text
/var/log/personalradar/nginx:/var/log/nginx
```

Install Fail2ban on the Dokploy host, copy the supplied filter and jail into the host configuration, then reload Fail2ban:

```bash
sudo cp deploy/fail2ban/filter.d/ptr-nginx-abuse.conf /etc/fail2ban/filter.d/
sudo cp deploy/fail2ban/jail.d/ptr-nginx.conf /etc/fail2ban/jail.d/
sudo cp deploy/fail2ban/action.d/ptr-docker.conf /etc/fail2ban/action.d/
sudo fail2ban-client reload
sudo fail2ban-client status ptr-nginx-abuse
```

Fail2ban intentionally runs on the host rather than inside the application container. Host operation gives it access to the firewall without granting the frontend container `NET_ADMIN`. Its supplied action inserts bans into Docker's `DOCKER-USER` chain, which sees traffic before it reaches Traefik. The Nginx real-IP configuration trusts only loopback and private Docker networks, allowing Fail2ban to identify Traefik's forwarded client address in the access log.
