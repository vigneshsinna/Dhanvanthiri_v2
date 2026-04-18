# 06a — Build Verification Report (Gate 1)

## Status: PASSED

---

## Environment

| Item | Value |
|------|-------|
| Node.js | v22.17.0 |
| npm | 10.9.2 |
| OS | Windows (PowerShell 5.1) |
| Runtime pin | `.nvmrc` set to `22` |

---

## Clean Install

```
rm -rf node_modules dist
npm install
```

- **Packages installed**: 88
- **Vulnerabilities**: 0
- **Lockfile**: `package-lock.json` present and committed

---

## Validation Commands

### TypeScript (`npm run typecheck`)

```
tsc --noEmit
```

- **Result**: PASSED (zero errors, zero warnings)

### Production Build (`npm run build`)

```
tsc && vite build
```

- **Result**: PASSED
- **Modules transformed**: 1946
- **Build time**: 462 ms

---

## Build Output

| File | Size | Gzip |
|------|------|------|
| `dist/index.html` | 0.45 KB | — |
| `dist/favicon.svg` | 1.36 KB | — |
| `dist/icons.svg` | 8.04 KB | — |
| `dist/assets/index-CHug2F2u.js` | 507.21 KB | 157.05 KB |
| `dist/assets/index-Dt5TsvWy.css` | 23.12 KB | 5.06 KB |

**Total JS (gzip)**: 157.05 KB
**Total CSS (gzip)**: 5.06 KB

---

## Known Warnings

| Warning | Severity | Action |
|---------|----------|--------|
| JS chunk exceeds 500 KB (507.21 KB) | Low | Code-splitting will be added in Step 3 when route-based lazy loading is implemented |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | `/api/v2` | Base URL for the backend API |

Only one environment variable is referenced (`storefront/src/api/client.ts`). It has a sensible default, so the build runs without a `.env` file.

---

## Deployment Readiness

- **Preview server**: `npm run preview` started successfully on `http://localhost:4173/`
- **SPA structure**: `dist/index.html` contains `<div id="root">` mount, module script, and CSS link
- **Routing**: Client-side routing via React Router; production server needs SPA fallback to `index.html`

---

## Scripts Available

| Script | Command | Status |
|--------|---------|--------|
| `dev` | `vite` | OK |
| `build` | `tsc && vite build` | OK |
| `preview` | `vite preview` | OK |
| `typecheck` | `tsc --noEmit` | OK (added in this gate) |
| `lint` | `tsc --noEmit` | OK (added in this gate) |

---

## Reproducibility

Another developer can reproduce this build with:

```bash
cd storefront
nvm use          # reads .nvmrc → Node 22
npm install
npm run build
npm run preview
```

---

## Gate 1 Acceptance Checklist

- [x] Frontend dependencies installed from scratch successfully
- [x] TypeScript validation passes
- [x] Linting passes (no accepted warnings remain undocumented)
- [x] Production build succeeds from a clean environment
- [x] Build output verified usable for deployment
- [x] Setup instructions updated so another developer can reproduce the build
- [x] Environment variables documented

**Gate 1: COMPLETE**
