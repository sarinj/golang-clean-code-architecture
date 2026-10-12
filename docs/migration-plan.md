# Go to FastAPI migration

Goal: Replace the Go application with Python and FastAPI while keeping its clean architecture and existing API routes.

Constraints:

- Keep `config`, `domain`, `usecases`, `interface`, `infrastructure`, and `shared` under `src`.
- Keep framework and database imports out of the domain and use cases.
- Preserve PostgreSQL table and column names, bcrypt hashes, JWT claim structure, response envelopes, and `GOAPP_` configuration compatibility.
- Preserve the existing HTTP methods, including `POST /api/v1/users/profile`.
- Preserve MongoDB as an optional generic data adapter.
- Keep the generic HTTP API limited to the read and describe operations exposed by the Go application.

Files involved: Replace Go source, dependency manifests, generated Swagger files, configuration template, and setup documentation. Add Python packaging, migrations, database mappings, FastAPI handlers, and focused verification.

Success criteria:

- Registration, login, refresh, logout, profile, monitor, and authenticated generic data reads work.
- PostgreSQL mappings match the original `users`, `user_tokens`, and `user_permissions` tables.
- Passwords stay out of every public response and schema.
- Domain entities and repository/security protocols use only Python's standard library.
- Settings accept the existing environment variables and new `APP_` variables.
- Installation, migrations, startup, and Docker Compose are documented.

Open questions: No product changes are needed. Unfinished Go write placeholders have no public routes to migrate. PostgreSQL and MongoDB integration depend on available local services.

Ordered steps:

1. Map the original routes, entities, authentication flow, and database mappings.
2. Implement Python domain types, repository/security protocols, and use cases.
3. Implement SQLAlchemy and PyMongo adapters, settings, and migration support.
4. Wire FastAPI request validation, dependency injection, error responses, CORS, and OpenAPI documentation.
5. Replace Go setup files and document installation and extension points.
6. Check packaging and imports, exercise authentication and pagination, and review the final diff.

Verification commands: Install the editable Python package and development dependencies, run Ruff, run focused API verification, and inspect Alembic's generated PostgreSQL SQL.

Risks:

- The Go refresh-token implementation used the access expiry setting. The Python implementation uses the configured refresh expiry and preserves that deadline when refreshing.
- The Go PostgreSQL list implementation counted only the current page. Python counts the full result set.
- The Go schema generator produced blank names for some embedded fields. Python describes the actual public fields.
- Existing database schemas must be compared with the initial migration before adopting an Alembic baseline.
- Docker is installed but its daemon is unavailable at the start of the migration. Verification must state which real services were exercised.

Stop conditions: Stop only for missing information that prevents a compatible implementation, or for an external operation requiring approval. Local implementation and review are authorized by the migration request.

## Completed implementation

The Go source, dependency files, and generated Swagger files have been replaced with the Python application. The original registered routes and PostgreSQL mappings are present. Setup instructions, Docker support, Alembic migrations, and legacy configuration support are documented in the README.

Verification completed on Python 3.14.6 locally and Python 3.13 in the API container:

- All 29 default checks passed against SQLite. The three service integration checks skip when service URLs are absent.
- All 32 checks passed against PostgreSQL 15 and MongoDB 6.0.8, including authentication, pagination, architecture boundaries, transaction rollback, legacy credentials, real MongoDB API reads, concurrent registration, and concurrent refresh token reuse.
- Ruff lint and formatting checks passed. Installed dependencies passed `pip check`.
- The wheel built and included the application, migration revisions, and Alembic template.
- The packaged wheel ran outside the source directory. Its migration command and real HTTP requests through Uvicorn passed for monitor, registration, login, profile, data listing, and OpenAPI.
- Alembic upgrade, metadata comparison, downgrade, and re-upgrade passed against a temporary SQLite database. PostgreSQL SQL generation passed. The migration applied to a fresh PostgreSQL database, and live schema comparison found no differences from the SQLAlchemy models.
- Docker Compose configuration validation and the production image build passed. The container's HTTP API passed monitor, registration, duplicate email, login, profile, pagination, retrieval, schema, refresh rotation, logout revocation, OpenAPI, Swagger, routing errors, and CORS checks.

Docker Desktop was started for the live checks. Verification used a separate Compose project, fresh database volumes, and random loopback ports. Test schemas and databases were removed after use. The temporary Compose services and volumes were removed after verification.
