# Cron Builder

A self-contained, client-side cron expression builder and explainer. No server required.

## Features

- Visual builder for 5-field cron expressions (minute/hour/day-of-month/month/day-of-week) with optional 6th second field
- Supports all modes per field: wildcard (`*`), every-N (`*/5`), specific values, and ranges
- Plain-English explanation of the current expression (live)
- "Next N run times" preview with timezone select (computed in-browser)
- Click-to-edit / paste-to-parse: paste any existing cron expression to parse, explain, and validate it with clear error messages
- Common presets (every minute, hourly, daily, weekly, monthly, etc.)
- Dark theme, responsive layout

## Library choices

| Library | Version | Why |
|---------|---------|-----|
| [cronstrue](https://github.com/bradymholt/cronstrue) | ^3 | Widely maintained; converts cron to plain English; supports 5 and 6 field expressions |
| [cron-parser](https://github.com/harrisiirak/cron-parser) | ^5 | Standard cron-iterator; exposes `CronExpressionParser.parse()` + `.next()` for computing fire times in-browser; timezone-aware via `tz` option |

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # run unit tests
npm run build      # production build to dist/
```

## Tests

Unit tests cover the pure logic layer (`src/lib/cron.ts`):

- `fieldToSegment`: all field modes (wildcard, every, every-n, specific, range)
- `stateToExpression`: full state-to-string assembly including 6-field
- `validateExpression`: valid 5-field, valid 6-field, empty, wrong counts, out-of-range values
- `explainExpression`: human-readable output checks
- `getNextRuns`: deterministic next-run assertions against a pinned base date (2026-01-01T00:00:00Z), including hourly spacing, weekday filtering, monthly boundaries
- `expressionToState`: round-trip parsing back to field state

Run with `npm test` (vitest).

## Cloudflare Pages deploy

Build output is `dist/`. Deploy config:

- Build command: `npm run build`
- Output directory: `dist`
- Node version: 20+

The `_redirects` file at the project root handles SPA routing (all paths -> `index.html 200`).
The `_headers` file sets security headers on all routes.

Cloudflare Pages picks up both files automatically from the output directory. Copy them into `dist/` if your Pages config does not serve from the project root:

```bash
cp _redirects _headers dist/
```

Or add a `postbuild` script:

```json
"postbuild": "cp _redirects _headers dist/"
```
