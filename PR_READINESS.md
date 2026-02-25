# PR Readiness

## Scope completed

- Scaffolded FastAPI TODO backend with startup entrypoint and health endpoint.
- Implemented TODO CRUD endpoints with validation and error handling.
- Added API tests for CRUD and edge cases.
- Added GitHub Actions workflow for lint and tests on `push` and `pull_request`.

## Validation results (local runner)

- `python3 -m compileall -q app tests` -> pass
- `python3 -m pytest -q` -> fail (`No module named pytest`)
- `python3 -m ruff check .` -> fail (`No module named ruff`)

Local runner has no network/package access to install missing modules. CI installs `.[dev]` and executes lint/tests.

## PR checklist

- [x] Branch contains only feature work for this phase.
- [x] CI workflow file exists at `.github/workflows/ci.yml`.
- [x] Commits are ready for PR review.
