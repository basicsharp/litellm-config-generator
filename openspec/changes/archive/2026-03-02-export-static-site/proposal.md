## Why

The app is currently only deployable as a Node.js server. Since all meaningful logic runs in the browser (YAML generation, catalog loading from `/public/`), the app can be exported as a fully static bundle and hosted on any CDN or static host (GitHub Pages, Netlify, S3, Vercel static) without maintaining a server process.

## What Changes

- Add `output: 'export'` to `next.config.ts` to enable Next.js static export
- Add `npm run export` script that runs `next build` with static output
- Verify all pages/components work in static mode (no dynamic server features used)
- Update `README.md` with static export usage instructions and hosting examples

## Capabilities

### New Capabilities

- `static-export`: Produces a self-contained `out/` directory of HTML/CSS/JS files deployable to any static host without a Node.js runtime

### Modified Capabilities

<!-- No existing spec-level behavior changes -->

## Impact

- `next.config.ts`: Add `output: 'export'`
- `package.json`: Add `export` script
- `README.md`: Document new export scenario
- No API routes or server-side data fetching exists in the codebase, so no breaking changes expected
