# Clean API workspace

A FastAPI backend and a Next.js frontend. The Python API preserves the original Go project's clean architecture. The UI provides registration, login, an overview, profile details, and paginated views of users, sessions, and permissions.

```text
.
├── backend/                 Python API, migrations, tests, and Dockerfile
├── frontend/                Next.js App Router application and browser checks
├── docker-compose.yml       Frontend, API, PostgreSQL, and MongoDB
└── LICENSE
```

## Run locally

Requirements: Python 3.11+, Node.js 22+, npm, and Docker for the databases.

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'
cp env.template .env
```

Set `APP_SECRET_KEY` in `backend/.env`. Generate a value with `python -c 'import secrets; print(secrets.token_urlsafe(32))'`.

```bash
docker compose -f ../docker-compose.yml up -d db mongodb
python -m src.infrastructure.database.postgres.migration
uvicorn src.infrastructure.fastapi.main:app --reload --host 127.0.0.1 --port 3000
```

### Frontend

In another terminal, from the repository root:

```bash
cd frontend
npm ci
cp env.template .env.local
npm run dev
```

Open [the frontend](http://localhost:3001). FastAPI runs at [port 3000](http://127.0.0.1:3000), with [API documentation](http://127.0.0.1:3000/docs).

## Run everything in Docker

Create `backend/.env` as above, then run from the repository root:

```bash
docker compose build
docker compose up -d db mongodb
docker compose run --rm api clean-api-migrate
docker compose up -d api frontend
```

The frontend is at `http://localhost:3001`. Compose connects Next.js to `http://api:3000` internally. The sample database credentials and `AUTH_COOKIE_SECURE=false` setting are for local HTTP. For an HTTPS deployment, set `AUTH_COOKIE_SECURE=true` and configure `APP_ORIGIN` with the public frontend origin when a reverse proxy changes the internal origin.

## Architecture and checks

- [Backend architecture and API contract](backend/README.md)
- [Frontend structure, hydration, and verification](frontend/README.md)
- [Backend migration notes](backend/docs/migration-plan.md)
- [Frontend implementation plan](frontend/docs/implementation-plan.md)

Run the backend checks from `backend/` and the frontend checks from `frontend/`:

```bash
# backend/
ruff check .
ruff format --check .
pytest -q

# frontend/
npm run lint
npm run format:check
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser checks require a running API and a migrated disposable database. They create real test accounts. See the frontend README for configuration.
