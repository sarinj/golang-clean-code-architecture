# FastAPI clean architecture template

This is a Python/FastAPI migration of the original GoFiber clean architecture template. It keeps the domain, use cases, handlers, repositories, and infrastructure as separate layers. PostgreSQL stores users, token sessions, and permissions. An optional PyMongo adapter supports generic reads for registered MongoDB models.

## Run locally

Run these commands from the repository's `backend/` directory. Frontend setup and the combined Docker workflow are in the [root README](../README.md).

Use Python 3.11 or newer and PostgreSQL 15. The Compose file also includes the original MongoDB service.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'
cp env.template .env
```

Set `APP_SECRET_KEY` in `.env`. Generate a value with `python -c 'import secrets; print(secrets.token_urlsafe(32))'`.

```bash
docker compose -f ../docker-compose.yml up -d db mongodb
python -m src.infrastructure.database.postgres.migration
python -m src.infrastructure.fastapi
```

The API runs at `http://127.0.0.1:3000`. Swagger UI is at `/docs`, with `/swagger/` as a compatibility redirect. OpenAPI JSON is at `/openapi.json`.

For development with automatic reload:

```bash
uvicorn src.infrastructure.fastapi.main:app --reload --host 127.0.0.1 --port 3000
```

The installed commands `clean-api` and `clean-api-migrate` also start the server and apply migrations.

## Run the API in Docker

Create `.env` as above, then run:

```bash
docker compose -f ../docker-compose.yml build api
docker compose -f ../docker-compose.yml up -d db mongodb
docker compose -f ../docker-compose.yml run --rm api clean-api-migrate
docker compose -f ../docker-compose.yml up -d api
```

The sample credentials in Compose and `env.template` are for local development. When using another database, update the credentials and host in `.env`.

## Architecture

```text
src/
├── config/                         Settings and generic model registration
├── domain/
│   ├── entities/                   Requests, responses, and public entities
│   ├── models/                     Stored domain data, without ORM annotations
│   ├── repositories/               Repository protocols
│   └── services/                   Password and token service protocols
├── usecases/                       Registration, authentication, and data reads
├── interface/
│   ├── handlers/fastapi/           Routes, validation, errors, and dependencies
│   └── repositories/              PostgreSQL and MongoDB adapters
├── infrastructure/
│   ├── database/postgres/          SQLAlchemy mappings, connections, and Alembic
│   ├── database/mongodb/           PyMongo connection lifecycle
│   └── fastapi/                    Application factory and server entry point
└── shared/                         JWT, bcrypt, serialization, and schema helpers
```

```mermaid
flowchart LR
    HTTP[FastAPI handlers] --> UC[Use cases]
    UC --> Domain[Domain entities and protocols]
    Adapters[Repository and authentication adapters] --> Domain
    Root[Infrastructure application factory] --> HTTP
    Root --> Adapters
```

The domain and use cases import only the standard library and domain modules. FastAPI/Pydantic handle HTTP validation. SQLAlchemy mappings stay in infrastructure, and repository adapters convert them into domain dataclasses. The application factory injects concrete repositories and security services into use cases.

Each request gets one SQLAlchemy session and transaction. A successful request commits before its response is sent; an exception rolls it back. Synchronous handlers and dependencies let FastAPI run blocking database and bcrypt work in its worker threads. Connections close during application shutdown.

## API routes

These are the routes registered by the Go application, including its `POST` method for profile retrieval.

The [Go compatibility reference](docs/api-compatibility.md) records request bodies, response keys, and the differences retained from the Python migration. Contract fixtures come from the upstream Go structs at commit `be30c67`.

| Method | Path | Authentication | Result |
| --- | --- | --- | --- |
| GET | `/api/v1/` | Public | Application name and version |
| POST | `/api/v1/users/register` | Public | User, status 201 |
| POST | `/api/v1/users/login` | Public | User and access/refresh tokens |
| POST | `/api/v1/users/refresh-token` | Refresh token in JSON | User and rotated tokens |
| POST | `/api/v1/users/logout` | Refresh token in JSON | JSON `null` |
| POST | `/api/v1/users/profile` | Bearer access token | User |
| GET | `/api/v1/data/{slug}/` | Bearer access token | Paginated data and schema |
| GET | `/api/v1/data/{slug}/{id}` | Bearer access token | Record and schema |
| GET | `/api/v1/data/{slug}/describe` | Bearer access token | Record schema |

The initial data slugs are `users`, `user-tokens`, and `user-permissions`. Lists accept `_page`, default 1, and `_pageSize`, default 10 and maximum 1000. Malformed query integers and 64-bit overflow use the respective defaults, as in Go. Pages below 1 become 1; sizes below 1 become 10. Other query parameters are ignored, as in the original handler.

Generic responses keep the original `code`, `data`, `message`, and `data_schema` keys. Lists also include `page`, `page_size`, `total_page`, and `total_data`. Token and permission data keep the Go JSON names `ID` and `UserId`. Passwords are excluded from records, nested users, and schemas. The schema response retains the original record description format, including its `datetime` type; it is not a standard Avro schema.

Errors use `{"trace_id": "users-001", "message": "..."}`. Invalid requests return 400, authentication failures on protected routes return 401, and duplicate registrations return 409. The original trace identifiers, including `middlware-002`, are preserved. FastAPI generates the API documentation from the routes and request/response schemas.

Register and log in:

```bash
curl -X POST http://127.0.0.1:3000/api/v1/users/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"example-password","first_name":"Alex","last_name":"Lee"}'

curl -X POST http://127.0.0.1:3000/api/v1/users/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"example-password"}'
```

Use the returned access token as `Authorization: Bearer <token>`. Refresh and logout accept `{"refresh_token":"<token>"}`.

## Configuration and existing Go data

Settings read `.env`, then `.env.dev`, with process environment variables taking precedence. Every original `GOAPP_` key remains accepted. New deployments can use the equivalent `APP_` key. When both names occur in the same source, `APP_` takes precedence. `APP_DATABASE_URL` optionally supplies a SQLAlchemy connection URL; individual PostgreSQL settings remain the default.

The SQLAlchemy mappings use the original `users`, `user_tokens`, and `user_permissions` tables and column names. Existing bcrypt hashes are accepted. HS256 JWTs keep `claims.id`, issuer, subject, and audience. Existing unexpired Go sessions can continue when the application name, secret, and database remain the same.

For a fresh database, run the migration command. For an existing Go database, compare its schema with the initial migration first. Once the three tables, columns, indexes, and foreign keys match, adopt the baseline without recreating tables:

```bash
alembic stamp 0001
alembic upgrade head
```

Subsequent schema changes use Alembic revisions:

```bash
alembic revision --autogenerate -m "describe the schema change"
alembic upgrade head
```

The migration corrects several defects in the Go template. Refresh tokens use `APP_JWT_REFRESH_EXPIRES`; refresh preserves the original refresh deadline. New token IDs make rotations distinct even within one second. PostgreSQL pagination counts all records. Schema descriptions include inherited public fields. Duplicate email errors return 409. Email, JSON, password, and pagination validation return structured errors. Bcrypt passwords are limited to 72 UTF-8 bytes.

Token sessions retain the original single-session behavior. Logging in again replaces the stored tokens; refreshing invalidates the previous token pair; logging out deletes the user's tokens. Permissions are loaded with the user, as in the original. The original template does not enforce resource-specific permission rules.

## Add a model

Define its dataclass in `src/domain/models/`. Add a `CRUDModel` entry to `src/config/crud_models.py`; its table name becomes the slug with underscores replaced by hyphens. Use field metadata `{"public": False}` to exclude a field from generic responses and schemas.

For PostgreSQL, add its SQLAlchemy mapping and a `to_domain()` method in `src/infrastructure/database/postgres/models.py`, register the dataclass/mapping pair in `POSTGRES_MODELS`, and create an Alembic revision. For MongoDB, register it with `datasource=Datasource.MONGODB`; no SQLAlchemy mapping is needed. MongoDB IDs use ObjectId and serialize as strings. Field metadata `bson_name` can map an attribute to a different document key.

The generic HTTP API exposes reads and schema descriptions. The Go write use cases were unfinished and had no registered HTTP routes.

## Checks

```bash
ruff check .
ruff format --check .
pytest -q
```

The default checks use a temporary SQLite database through the same SQLAlchemy repositories. Integration checks skip when their service URLs are absent. PostgreSQL DDL can be inspected without a running server using `alembic upgrade head --sql`.

To run the full suite against PostgreSQL and MongoDB, start the database services and set the test URLs:

```bash
docker compose -f ../docker-compose.yml up -d db mongodb
export TEST_DATABASE_URL='postgresql+psycopg://postgres:golang-first-api@127.0.0.1:5432/postgres'
export TEST_MONGODB_URI='mongodb://root:golang-first-api@127.0.0.1:27017/?authSource=admin'
pytest -q
```

Each PostgreSQL test creates and removes its own schema. MongoDB checks create and remove a separate test database. The integration checks exercise authenticated MongoDB reads and pagination, concurrent registration, and refresh token reuse.

Implementation references: [FastAPI dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/dependencies-with-yield/), [SQLAlchemy sessions](https://docs.sqlalchemy.org/en/20/orm/session_basics.html), [PyMongo reads](https://www.mongodb.com/docs/languages/python/pymongo-driver/current/crud/), and [PyJWT validation](https://pyjwt.readthedocs.io/en/stable/usage.html).
