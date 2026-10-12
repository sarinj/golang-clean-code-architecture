# Clean API frontend

Next.js 16.4.0 and React 19.3.0, with App Router and strict TypeScript. Axios handles browser HTTP requests. TanStack Query owns server data, shadcn/ui and Tailwind CSS provide UI components and styling, React Hook Form and Zod handle forms, and TanStack Table renders resource records. Lucide provides icons and Sonner provides notifications.

## Run

Start and migrate the FastAPI backend using the [root setup instructions](../README.md), then run from `frontend/`:

```bash
npm ci
cp env.template .env.local
npm run dev
```

The UI runs at `http://localhost:3001`; the default API origin is `http://127.0.0.1:3000`. Set `FASTAPI_URL` in `.env.local` to connect another API server. This variable stays on the server. Use `AUTH_COOKIE_SECURE=false` for local HTTP and `true` for HTTPS. Set `APP_ORIGIN` to the public UI origin behind a reverse proxy if it differs from the internal request origin.

For a production build:

```bash
npm run build
npm run start
```

## Folder structure

```text
src/
├── app/                         Route composition, metadata, loading, and errors
│   ├── (auth)/                  Login, registration, and session restoration
│   ├── (workspace)/             Protected dashboard, profile, and data pages
│   └── api/                     Thin adapters for same-origin browser requests
├── components/
│   ├── layout/                  AppShell, navigation, and account controls
│   ├── providers/               QueryProvider
│   ├── shared/                  Page headers, fields, loading, and errors
│   └── ui/                      Owned shadcn components
├── features/
│   ├── auth/                    Authentication forms and session operations
│   ├── dashboard/               Overview and service status
│   ├── data/                    Resource browser, schema, and record views
│   └── profile/                 ProfileView
└── lib/
    ├── api/                     Browser Axios client and error normalization
    ├── server/                  FastAPI fetches, cookies, and request QueryClient
    └── format.ts                Shared display formatting

tests/e2e/                       Browser checks against the real FastAPI API
```

Each feature contains the relevant `schemas/`, `api/`, `hooks/`, `server/`, `components/`, or `lib/` modules. Keep modules near the feature that owns them. React component filenames use PascalCase, such as `ProfileView.tsx`. Next.js convention files retain `page.tsx`, `layout.tsx`, `loading.tsx`, and `route.ts`. Import files directly rather than through barrel modules.

Pages and layouts are server components. Interactive forms, tables, navigation, and query consumers define the client boundaries. Server adapters import `server-only`; browser clients import `client-only`. Zod validates external responses and derives the domain types. The UI uses system fonts and local assets, so builds do not download external fonts.

## Server fetching and hydration

1. A request-scoped QueryClient, created through React `cache`, deduplicates server queries for that request.
2. Server pages fetch profile and resource data directly from FastAPI with native `fetch`, `cache: "no-store"`, and a timeout. Independent queries start together.
3. Successful validated queries are passed through `dehydrate` and `HydrationBoundary`. The workspace layout hydrates the profile; page boundaries hydrate their own resource queries.
4. Client hooks use the same query keys and a 30-second stale time, so hydration reuses the initial data. React Query manages explicit refreshes and later revalidation.
5. Pagination is stored in `page` and `pageSize` URL parameters. Next.js fetches the next page on the server and hydrates it; client hooks can also refetch through the Next.js API adapters.

Profile, dashboard, list, and record data render without browser JavaScript when the session is valid. Forms and interactive controls need JavaScript. API outages leave successful data available for retry. Errors that were not prefetched successfully load through the browser adapter and display the feature's error state.

## Authentication

FastAPI remains responsible for credential verification, JWT validation, refresh rotation, and logout. Next.js stores the access and refresh tokens in HttpOnly, SameSite cookies using the expiry returned by FastAPI. Browser responses, SSR HTML, and dehydrated query state contain public user data and redacted resource records.

Server pages with an expired access session redirect to a restoration page. That page sends a same-origin POST to refresh cookies, then returns to the validated original destination. Browser requests share one refresh promise; Web Locks coordinate tabs where available. The refresh adapter first checks the current access cookie, which prevents a queued tab from rotating an already refreshed session. Browsers without Web Locks coordinate within the current tab.

Every protected browser request still goes through FastAPI's authentication checks. The layout's cookie check only controls navigation. Mutating Next.js routes require a matching Origin header. Tokens stay on the server, and token/password fields in generic records are recursively redacted before either JSON responses or hydration. Logging out clears the query cache. API outages preserve session cookies for retry.

The registered resources match the backend defaults: `users`, `user-tokens`, and `user-permissions`. For another resource, update the resource schema/configuration and register it in the backend. The backend currently exposes resource reads and schema descriptions.

## Checks

```bash
npm run lint
npm run typecheck
npm run format:check
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser checks use the production build and a real running API. Run them against a disposable database; they create accounts and sessions. They cover forms, authentication, pagination, schema/detail views, mobile navigation, protected requests, HttpOnly cookies, token redaction, server rendering without JavaScript, hydration without duplicate initial fetches, and refresh coordination across tabs. One check injects a failed browser response to exercise retry, then retries against the real API.

Playwright starts `npm run start` on port 3001 unless a server is already available. For a server on another port, set both variables:

```bash
PLAYWRIGHT_EXTERNAL_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3101 npm run test:e2e
```

References: [Next.js project structure](https://nextjs.org/docs/app/getting-started/project-structure), [server and client components](https://nextjs.org/docs/app/getting-started/server-and-client-components), [TanStack Query hydration](https://tanstack.com/query/v5/docs/framework/react/guides/advanced-ssr), and [Next.js authentication](https://nextjs.org/docs/app/guides/authentication).
