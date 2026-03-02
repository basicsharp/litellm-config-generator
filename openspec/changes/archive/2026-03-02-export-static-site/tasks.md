## 1. Configuration

- [x] 1.1 Add `output: 'export'` to `next.config.ts`

## 2. Package Scripts

- [x] 2.1 Add `"export": "next build"` script to `package.json`
- [x] 2.2 Remove `"start": "next start"` script from `package.json`

## 3. Documentation

- [x] 3.1 Add "Export static site" scenario to `README.md` under Run Scenarios, documenting the `npm run export` command and describing the `out/` output directory
- [x] 3.2 Update `README.md` to remove the `npm run start` reference and note that `next start` is not supported in static export mode

## 4. Verification

- [x] 4.1 Run `npm run build` and confirm `out/` directory is created with `index.html`
- [x] 4.2 Serve `out/` with a local static server (e.g., `npx serve out`) and verify the app loads and all features work
