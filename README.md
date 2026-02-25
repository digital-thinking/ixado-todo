# ixado-todo

Minimal FastAPI TODO backend used to test ixado CLI task execution and CI integration.

## Requirements

- Python 3.11+

## Local setup

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
```

## Run the service

```bash
python -m app.main
```

Service endpoints:

- `GET /health`
- `GET /todos`
- `POST /todos`
- `GET /todos/{todo_id}`
- `PUT /todos/{todo_id}`
- `DELETE /todos/{todo_id}`

## Run tests and lint

```bash
python -m ruff check .
python -m pytest -q
```

## CI behavior

GitHub Actions workflow: `.github/workflows/ci.yml`

- Triggers on `pull_request`
- Triggers on `push` to `main` and `feature/**`
- Runs matrix builds on Python `3.11` and `3.12`
- Installs `.[dev]`, then executes:
  - `python -m ruff check .`
  - `python -m pytest -q`

## Notes for ixado testing

- This repository is intentionally simple to exercise ixado task orchestration.
- In this run, ixado tester auto-detection skipped tests because it currently checks for Node/Makefile runners (`package.json`/`Makefile`) and did not detect Python test execution automatically.
- CI workflow is the reliable execution path for lint/tests in pull requests.
