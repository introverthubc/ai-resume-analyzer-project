# Verification results

Verified 2026-09-11 (Asia/Calcutta).

- ESLint: passed with no errors or warnings.
- Backend tests: 5 passed; include real PDF parsing, version immutability, actual rewrites, input/JSON validation, missing configuration, quota handling, concurrency and reset behavior.
- Production build: passed. PDF export is loaded separately. Vite reports a non-blocking large-bundle warning for the chart/application and PDF renderer bundles.
- Edge browser flow: passed through V1 -> selected rewrite -> V2 -> apply all -> V3, including every analysis panel, refresh, old-version fetching, diff, PDF download text validation, dashboard/versions/history/insights, quota error and deletion. The isolated automated browser uses a test-only AI provider.
- Live Gemini API: passed using the supplied private environment file, model gemini-3.6-flash. The synthetic sample returned 2 usable rewrites; V1 score 37, V2 score 55. Original text remained unchanged and V2 contained the chosen replacement.
- Live frontend: passed against the real backend and V2 analysis. Verified Gemini model label, score breakdown, version switching and rewrite suggestions; zero uncaught browser errors.

The included screenshot and live-smoke.json concern synthetic test data, not a personal resume. The sample ID exists only in the active backend session. It will not resolve after restarting the server.

See README.md for startup steps and the database/auth/deployment limitations. No API key or .env contents are included in this report.
