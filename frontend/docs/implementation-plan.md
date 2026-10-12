# Next.js frontend implementation

## Goal

Build a responsive Next.js UI for the existing FastAPI authentication and generic read API. Keep the backend's clean architecture and organize the frontend by feature.

## Constraints

- Use App Router, strict TypeScript, Axios, TanStack Query, shadcn/ui, Tailwind CSS, React Hook Form, Zod, TanStack Table, Lucide, and Sonner.
- Keep `src/app` responsible for route composition. Feature folders own schemas, API services, query hooks, and components. Shared infrastructure lives in `src/lib`, and shared UI lives in `src/components`.
- Default to server components. Add client boundaries only for interactive forms, navigation, queries, and tables.
- Prefetch initial page data on the server with a request-scoped TanStack Query client. Dehydrate validated public data into `HydrationBoundary`; client hooks reuse the same keys.
- Use PascalCase for React component filenames. Keep Next.js convention files in their required lowercase form.
- Keep FastAPI as the source of truth for authentication. Next.js route handlers store access and refresh tokens in HttpOnly cookies and forward authenticated requests.
- Validate external payloads with Zod. Do not expose token values in browser responses or resource records.
- Use the existing read endpoints for users, sessions, and permissions. Pagination uses the backend totals. Schema and record views use real API responses.

## Files involved

- New `frontend/` application, package lock, configuration, feature modules, API route adapters, and browser checks.
- Root README, Docker Compose, and ignore rules for frontend setup and deployment.
- After completing the frontend, move the Python application and its tests/configuration into `backend/`, leaving `backend/` and `frontend/` as the root application folders. Update documentation and build contexts.
- Backend files only if an integration defect requires a fix.

## Success criteria

- Registration, login, profile, refresh, and logout work against FastAPI.
- Dashboard and paginated resource browser display real data, with loading, empty, error, and retry states.
- Unauthenticated requests cannot retrieve private data. Cookie tokens stay HttpOnly. Mutating routes reject cross-origin requests.
- Desktop and mobile layouts are usable with keyboard navigation and labeled form controls.
- Lint, formatting, strict type checks, production build, backend regression checks, and browser checks pass.

## Ordered steps

1. Scaffold Next.js and shared UI/configuration.
2. Implement schemas, API clients, cookie session adapters, and refresh coordination.
3. Build authentication, application shell, dashboard, profile, and resource views.
4. Add server prefetching and hydration, local/Docker setup documentation, and repeatable browser checks.
5. Move the Python project into `backend/` and update all paths and root setup instructions.
6. Verify against an isolated real database and production server, review, and commit.

## Verification commands

- `npm run lint`, `npm run format:check`, `npm run typecheck`, and `npm run build` in `frontend/`.
- `npm run test:e2e` against a running FastAPI service and the production Next.js server.
- `.venv/bin/pytest -q`, `.venv/bin/ruff check .`, and `git diff --check`.

## Risks and stop conditions

The API rotates its single token session on refresh and login. Refresh requests must be coordinated so parallel queries and browser tabs do not reuse the previous refresh token. A service outage must preserve cookies for a later retry. Verification databases must be isolated and removed afterward. Avoid persisting test credentials or tokens in tracked files.

## Verification results

- Both production Docker images built successfully from their separate `backend/` and `frontend/` contexts. Alembic migrated the isolated PostgreSQL database, and the API and frontend started together.
- All 10 Playwright checks passed against the production containers and real PostgreSQL data. This includes registration/login/logout, validation, profile, resource pagination and details, schema views, empty states, mobile navigation, error/retry states, protected routes, HttpOnly cookies, token redaction, and restoration across tabs.
- Profile and resource tables displayed real data with browser JavaScript disabled. Hydration reused the initial server queries without duplicate browser profile/list requests.
- All 32 backend tests passed against real PostgreSQL and MongoDB after moving the Python project into `backend/`.
- Strict TypeScript checks, ESLint with zero warnings, Prettier, Ruff, and production builds passed. Manual browser inspection covered desktop login, dashboard, resource tables, and mobile views; no browser page errors occurred.
- `npm audit --omit=dev` reported zero runtime advisories. The full dependency audit currently reports nine advisories in development tooling.

The live checks caught and fixed three integration defects: URL validation rejected local/container hostnames; the Docker request origin needed the public Host header; and an invalid-session shell could start a refresh before a server redirect aborted the request. The layout now defers to the page redirect before mounting that shell. Pagination is parsed on the server and passed into the client table, so the initial table renders before hydration.
