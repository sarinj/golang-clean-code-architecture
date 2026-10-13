# Compatibility with the Go API

The reference is [max38/golang-clean-code-architecture at be30c67](https://github.com/max38/golang-clean-code-architecture/tree/be30c67013a5c4aaa6ab43b31bf33593ffa98a05). That is the upstream commit from which this repository was forked. Compare registered handlers and JSON structs when checking compatibility. The original generated Swagger document has outdated paths and methods.

The [contract fixture](../tests/fixtures/go_contract.json) contains JSON encoded by the original Go request, response, and model structs, plus their schema descriptions. It was generated with Go 1.20 from that commit. [Contract checks](../tests/test_go_contract.py) exercise the Python HTTP endpoints against those field names, JSON types, envelopes, and schema record names. Runtime values such as IDs, timestamps, and signed tokens are checked separately.

## Requests and successful responses

All paths below start with `/api/v1`. Authentication uses `Authorization: Bearer <access-token>` on profile and data routes.

| Method and path | JSON request body | Status and response |
| --- | --- | --- |
| `GET /` | None | 200, `{"name":"...","version":"..."}` |
| `POST /users/register` | `{"email":"...","password":"...","first_name":"...","last_name":"..."}` | 201, user object |
| `POST /users/login` | `{"email":"...","password":"..."}` | 200, `{"user":{...},"token":{"access":"...","refresh":"..."}}` |
| `POST /users/refresh-token` | `{"refresh_token":"..."}` | 200, the same envelope as login |
| `POST /users/logout` | `{"refresh_token":"..."}` | 200, JSON `null` |
| `POST /users/profile` | None | 200, user object |
| `GET /data/{slug}/` | None | 200, paginated data envelope |
| `GET /data/{slug}/{id}` | None | 200, record envelope |
| `GET /data/{slug}/describe` | None | 200, schema record |

Registration names default to empty strings when omitted. The user object has exactly `id`, `email`, `first_name`, `last_name`, `created_at`, and `updated_at`. IDs are integers and timestamps are ISO 8601 strings with a timezone. Passwords are excluded.

The record envelope has `code`, `data`, `message`, and `data_schema`. Lists add `page`, `page_size`, `total_page`, and `total_data`. Successful envelopes have `code: 0` and `message: ""`. Schema descriptions return a record directly.

The registered slugs are `users`, `user-tokens`, and `user-permissions`. Token and permission records retain the original case-sensitive `ID` and `UserId` keys. Nested users have the same public fields as authentication responses. Token records also have `access`, `refresh`, and `updated_at`; permission records have `permission` and `updated_at`.

List query names are `_page` and `_pageSize`, with defaults of 1 and 10. Like Go's `strconv.Atoi`, parsing accepts signed ASCII integers and falls back to the corresponding default for malformed values or 64-bit overflow. Pages below 1 become 1 and page sizes are capped at 1000. Other query parameters are ignored.

Schema names are `user-model`, `user-token-model`, and `user-permission-model`. Nested user records also use `user-model`. The original `datetime` type name remains supported.

Source definitions: [registered routes](https://github.com/max38/golang-clean-code-architecture/blob/be30c67013a5c4aaa6ab43b31bf33593ffa98a05/src/infrastructure/gofiber/server/module.go), [user requests](https://github.com/max38/golang-clean-code-architecture/blob/be30c67013a5c4aaa6ab43b31bf33593ffa98a05/src/domain/entities/user/request.go), [user responses](https://github.com/max38/golang-clean-code-architecture/blob/be30c67013a5c4aaa6ab43b31bf33593ffa98a05/src/domain/entities/user/user.go), [data envelopes](https://github.com/max38/golang-clean-code-architecture/blob/be30c67013a5c4aaa6ab43b31bf33593ffa98a05/src/domain/entities/crud/response.go), and [stored models](https://github.com/max38/golang-clean-code-architecture/blob/be30c67013a5c4aaa6ab43b31bf33593ffa98a05/src/domain/models/user.go).

## Differences retained from the Python migration

This port preserves the successful request and response formats. It also retains the migration's corrections, so its behavior is not identical for every input or schema description.

| Area | Original Go behavior | Python behavior |
| --- | --- | --- |
| Duplicate registration | 500 with a database error | 409 with `users-001` and a public message |
| Input validation | Go's email regex and JSON decoder; several missing or empty strings reach the use case | Email validation, required nonempty credentials, and a 72-byte bcrypt password limit; invalid requests return 400 |
| Error messages | Some errors contain database, bcrypt, or JWT library text | Structured `trace_id` and `message` keys with controlled messages |
| Malformed logout body | Uses the refresh handler's `users-003` trace | Uses the logout handler's `users-004` trace |
| Unknown route message | `rotuer not found` | `router not found`, with the same `middlware-001` trace |
| Pagination totals | Counts rows on the current PostgreSQL page | Counts the entire result set |
| Negative page size | Can remove the PostgreSQL query limit | Defaults to 10 |
| Database offset overflow | Can overflow Go's integer arithmetic | Returns a structured 400 error |
| Schema fields | Empty names for fields without JSON tags; embedded user fields are not expanded | Named public fields, expanded nested schemas, and nullable types where the database permits null |
| Nested data users | Generic queries leave unloaded associations as zero-valued user structs | Loads the related user, or returns null when the association is absent |
| Token expiry and rotation | Uses the access expiry setting for new refresh tokens; same-second rotations can be identical | Uses the refresh expiry setting, preserves the refresh deadline, and issues distinct token pairs |

## Next.js browser endpoints

The Next.js `/api/*` routes adapt this API for the browser. They are separate from the Go-compatible `/api/v1/*` contract. Login returns public user data while storing tokens in HttpOnly cookies; refresh and logout return 204; the browser's profile GET calls FastAPI's profile POST. Token records are redacted before they enter browser JSON or server-rendered HTML.

FastAPI remains responsible for checking credentials, verifying JWTs, rotating sessions, and authenticating every protected request. Next.js owns cookie transport, same-origin checks, and presentation. See the [frontend authentication documentation](../../frontend/README.md#authentication).
