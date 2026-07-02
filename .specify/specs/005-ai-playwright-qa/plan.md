# 005 — AI-Playwright QA · Plan

## Spec format
```yaml
journey: view-devices-as-anon
description: Anonymous visitor lands on devices page and sees rows.
steps:
  - goto: /resources/devices
  - expect_text: Devices
  - expect_min_rows: 10
  - screenshot: devices-anon
```

## Runner
- Node script under `e2e/ai-runner/` reads yaml specs from `e2e/journeys/`, uses Lovable AI Gateway to translate each into a Playwright test, then runs it.
- Existing `playwright.config.ts` is reused.

## CI
- Existing `.github/workflows/qa.yml` gets a new job that runs the AI runner against the PR preview URL and comments results.