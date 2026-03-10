.PHONY: all install test setup-auth

all: install test

install:
	poetry install
	poetry run playwright install firefox

test:
	poetry run python smoke_test.py

# Run once to log in and save session to auth-state.json
setup-auth:
	env $$(cat .env.test | xargs) poetry run python setup_auth.py
