# skillstore-smoke-back

Backend smoke tests for SkillStore Lambda functions and Step Function pipelines.

## Setup

```bash
cd backend/libs/skillstore-smoke-back
make install
```

## Run Tests

```bash
make test                    # All tests
make test-one FILE=skillstore_smoke_back/tests/test_screen_skills.py  # Single file
poetry run pytest -k "safe"  # Pattern match
```

## Structure

```
skillstore_smoke_back/
├── conftest.py          # Shared fixtures (Lambda client, invoke helper)
├── fixtures/
│   └── skills.py        # Test skill markdown fixtures
└── tests/
    └── test_screen_skills.py        # esm-live-screen-skills E2E tests
```

## Adding Tests

1. Create `skillstore_smoke_back/tests/test_<feature>.py`
2. Use the `invoke` fixture to call Lambdas: `result = invoke("lambda-name", payload)`
3. For test data, add fixtures under `skillstore_smoke_back/fixtures/`
