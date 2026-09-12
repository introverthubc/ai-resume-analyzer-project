# AI Resume Analyzer

The existing React design is preserved. The resume flow now uses the Express backend and Gemini; resume data is held in memory for the lifetime of the backend process.

## Run

Use Node.js 22.12+ (tested with Node 24.14).

1. Run `npm ci` in this folder.
2. Copy `.env.example` to `.env`, then set `GEMINI_API_KEY` locally. Never put the key in a `VITE_` variable. If you are using the working copy prepared in Codex, your supplied `.env` is already copied there.
3. Run `npm start` (or double-click `START.cmd` on Windows).
4. Open http://localhost:5173. The backend runs at http://localhost:5000.

Alternatively use two terminals: `npm run server` and `npm run dev`.
If ports are occupied, stop the previous app first. If changing backend PORT, also update the Vite proxy target or set VITE_API_URL to the backend URL including `/api`.

The ZIP intentionally excludes `.env` and `node_modules`; add your local `.env` and run `npm ci` after extracting it.

## Working flow

- Upload a PDF (maximum 5 MB) and create V1 with its complete extracted text.
- Analyze the selected version, optionally for a target role.
- Read the score, four score components, strengths, issues/fixes, present/missing keywords, verdict and rewrite suggestions.
- Apply selected suggestions or all suggestions. Actual text replacements create a new immutable version; the source version is preserved.
- The new version is automatically analyzed. If Gemini is unavailable, the new text version is still saved and analysis can be retried.
- Switch versions, refresh the page, compare word/line diffs and export the selected version as a PDF.
- Resume list, deletion, dashboard, insights, versions, history, search and activity notifications reflect this backend session.

`GEMINI_MODEL` is configurable. The default `gemini-3.6-flash` was verified with the supplied key. Responses request a JSON schema, accept fenced/prose-wrapped JSON, normalize renderable data and retry once for invalid output. Invalid responses, missing configuration, quota problems, missing versions and invalid PDFs return readable errors. Scores are the sum of four 0–25 components, an advisory estimate rather than an actual employer ATS result.

Rewrites must match a unique source passage (allowing PDF whitespace differences). The backend rejects stale, unknown or overlapping selections and deduplicates repeated submissions. The prompt prohibits invented qualifications and achievements; suggestions introducing new numerical claims are excluded. Review every proposed rewrite before applying it.

Text preview and PDF export use the version's full text. This avoids silently losing content when sections cannot be classified. Export is a clean text layout, not a reproduction of the uploaded PDF's original visual layout. Scanned PDFs need OCR before upload; corrupt or encrypted files show a clear error.

## Validation

- `npm run lint`: ESLint and React checks.
- `npm test`: real PDF extraction; upload/analyze/rewrite/version persistence; original preservation; JSON parsing; invalid input, quota and missing-key handling; concurrency and fresh-session checks. The AI provider is injected only in tests.
- `npm run build`: production frontend bundle.
- `npm run test:e2e`: isolated Edge browser test on ports 5174/5001. Tests every analysis panel, selected/all rewrites through V3, refresh/version switching, actual word/line comparison, PDF download text, dashboard/history/insights, quota errors and deletion. Uses an explicit test provider, never a production fallback. Microsoft Edge is required by the test configuration.
- `npm run test:live`: optional live Gemini check against an already running backend. Makes real API calls using the backend's key, uploads a synthetic sample, applies a rewrite, preserves V1 and analyzes V2. Leaves the sample in the current session; normal Gemini quota applies.

Live verification on 2026-09-11 (India): Gemini 3.6 Flash returned two applicable suggestions; V1 scored 37 and rewritten V2 scored 55. This is a sample result, not a promised improvement for other resumes.

## Production work remaining

- Database and file/object storage: all resumes, versions, analyses and history disappear when the backend restarts. Browser refresh preserves them only while that backend remains running.
- Real authentication and authorization: the existing login/register/profile screens still use local demo identity storage; passwords are not verified. There is no user isolation on the backend. This is a local single-user application until authentication is implemented.
- Deployment: HTTPS, authenticated API access, environment/secret management, request rate limits and durable storage must be configured for a hosted service. The backend currently binds only to the local computer.

The supplied ZIP and synced project sources were not modified. No API key is included in the deliverable ZIP or test reports.

Gemini integration reference: https://ai.google.dev/gemini-api/docs/generate-content/structured-output and the installed `@google/genai` type declarations.

Read-only live browser check: after test:live, run `node tests/live-browser.js` while both app servers are running. It verifies the real Gemini result in the frontend and saves a screenshot in validation/.
