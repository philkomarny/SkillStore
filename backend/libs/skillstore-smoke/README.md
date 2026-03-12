# skillstore-smoke

Playwright smoke tests for eduskillsmp.com.

## Setup

```bash
make all          # Install deps + run tests
make setup-auth   # One-time: save Google OAuth session to auth-state.json
make test         # Run smoke tests (requires auth-state.json)
```

Uses Firefox (headless Chromium is blocked by Cloudflare).
