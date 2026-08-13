# Personal Tech Radar frontend

Angular 21 standalone application for Personal Tech Radar. It uses server-side rendering and client hydration to provide an SEO-ready foundation for personalized engineering feeds, radar configuration, interests, sources, and administration.

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

SSR host validation currently allows `localhost` and `127.0.0.1`. Add each deployed public hostname to `projects.ptr-frontend.architect.build.options.security.allowedHosts` during deployment configuration; do not use a wildcard in production.
