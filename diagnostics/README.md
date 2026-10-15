# diagnostics/

This directory contains **one-off diagnostic and investigation scripts** created during debugging sessions.

These files are **not part of the regular test suite** and are excluded from:
- Playwright test discovery (`testDir: './tests'` in `playwright.config.ts`)
- TypeScript compilation (`tsconfig.json` does not include this directory)
- Jenkins pipeline execution

## Running a diagnostic script

```bash
# Run a specific diagnostic spec with Playwright
npx playwright test diagnostics/<file>.spec.ts --project=chromium --workers=1 --reporter=list

# Run a standalone TypeScript diagnostic
npx tsx diagnostics/<file>.ts
```

## Files

| File | Purpose |
|------|---------|
| `check-cms-ls.spec.ts` | Inspect CMS localStorage keys after login |
| `check-home-inputs.spec.ts` | Detect email/password inputs on CMS home page |
| `check-inputs.spec.ts` | Track input visibility at intervals post-login |
| `check-news-content.spec.ts` | Inspect news listing page content |
| `check-news-nav.spec.ts` | Check URL behaviour when navigating to news routes |
| `check-post-login.spec.ts` | Verify input state after CMS login |
| `check-session-persist.spec.ts` | Verify session persists across page navigations |
| `diagnose-login.spec.ts` | Trace login form disappearance timing |
| `find-cards.spec.ts` | Identify news card selectors on CMS pages |
| `find-cms-news.spec.ts` | Discover CMS news module URLs |
| `find-news-mgmt.spec.ts` | Find news management URL in CMS |
| `find-news-url.spec.ts` | Trace CMS news navigation via nav links |
| `inspect-cms-news.spec.ts` | Full page inspection of CMS news module |
| `inspect-news.spec.ts` | Inspect news listing page selectors |
| `test-cms-ls.ts` | Standalone: check CMS localStorage (tsx) |
| `test-cms-session.ts` | Standalone: check CMS session state (tsx) |
| `test-cms-session2.ts` | Standalone: diagnose session after login (tsx) |
