## Context

The app is a pure client-side tool: YAML generation, catalog loading, and form state all run in the browser. Catalog data is pre-built JSON served from `public/catalogs/`. There are no API routes, no server actions, and no `getServerSideProps` usage.

Next.js 15 ships a first-class `output: 'export'` mode that emits a self-contained `out/` directory compatible with any static host. No separate export toolchain is needed.

## Goals / Non-Goals

**Goals:**

- Enable `next build` to emit a static `out/` directory via `output: 'export'`
- Add an `npm run export` convenience alias
- Document the new deployment path in `README.md`

**Non-Goals:**

- Continuous deployment or CI/CD pipeline setup
- Image optimization (Next.js disables it in static mode — not used in this app)
- Server-side features — none exist and none will be added as part of this change

## Decisions

### Decision: `output: 'export'` in `next.config.ts`

**Why**: This is the canonical Next.js 15 mechanism for static export. It integrates with the existing `next build` command and requires zero extra dependencies.

**Alternatives considered**:

- `next export` CLI (deprecated in Next.js 14+) — rejected; removed from Next.js 15
- Custom webpack/esbuild bundler — rejected; massive overhead for a change achievable with one config line

### Decision: Reuse `next build` as the export mechanism

**Why**: With `output: 'export'` set, `next build` already writes to `out/`. A separate `npm run export` script is just an alias pointing to `next build` for discoverability, but both commands produce the same result.

### Decision: No `trailingSlash` or `basePath` changes

**Why**: The app is served from the root path on any static host. Adding `trailingSlash: true` is a common static-hosting convention but is not required for the app to function and would change existing URL behavior.

## Risks / Trade-offs

- **Next.js Image component restrictions** → The app does not use `<Image>` from `next/image`, so this is a non-issue.
- **Dynamic routes** → None exist in the app; all pages are statically known at build time.
- **`next start` no longer works after switching to `output: 'export'`** → `npm run start` must be removed or updated to use a static file server. Mitigation: document this in `README.md` and remove the `start` script to prevent confusion.
