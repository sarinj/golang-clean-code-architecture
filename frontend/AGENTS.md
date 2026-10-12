<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions

- React component files use PascalCase, such as `ProfileView.tsx` and `Button.tsx`. Next.js route convention files keep their required names.
- Keep `src/app` for route composition and metadata. Features own their schemas, services, query hooks, server adapters, and components.
- Import local modules directly from their files. Do not add feature barrel files.
- Keep credentials and FastAPI access in modules that import `server-only`. Browser API clients import `client-only`.
- Prefetch page data with the request-scoped server QueryClient. Use shared query keys and hydrate validated public data into TanStack Query.
- Token values must not enter public JSON, HTML, or dehydrated query state. Keep the same redaction when fetching on the server and through route handlers.
- Validate external data with Zod and infer types. Avoid `any`, assertions, and duplicate API response types.
- Run lint, type checks, formatting, the production build, and browser checks when verification is requested.
