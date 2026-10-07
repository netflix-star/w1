# Forma — 3D Configurator Studio

A browser authoring application and customer configurator built from the updated [production starter requirements](docs/requirements/00_PROJECT_BIBLE.md). The previous automotive-only starter documents are superseded. Imported assets and saved project data drive the application.

The current implementation supports **Import → Author → Configure → Studio → Publish → Share → Export**, with a PostgreSQL API and private storage. It has been tested locally, including a Docker deployment against PostgreSQL and an S3 emulator. Public production deployment and the complete production readiness checklist remain open; see [validation](docs/VALIDATION.md) and [remaining work](docs/IMPLEMENTATION_PLAN.md).

## Development

Requires Node.js 24, npm and Docker for local PostgreSQL. From the repository:

```sh
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
npm run services
npm run db:migrate
npm run dev:api
```

In a second terminal:

```sh
npm run dev -- --port 5173 --strictPort
```

`services` generates an ignored `.env` with random development credentials when none exists. It starts PostgreSQL and uses private filesystem asset storage by default. It preserves existing configuration and containers. Vite proxies `/api` to port 3001. Register an account through the app to use workspace persistence, publishing and HDRI uploads; local unsigned drafts can still be saved in IndexedDB.

For S3 adapter testing, run `npm run services:s3` and `STORAGE_DRIVER=s3 npx tsx scripts/storage-smoke.ts`. LocalStack is a development emulator, not production storage. Do not use these local credentials or public registration defaults in production.

## Included behavior

- Bounded GLB 2.0 and self-contained JSON glTF import; stable source node/material identities, hierarchy inspection, search and bulk semantic mapping. Original bytes remain immutable; normalized runtime GLBs are separate assets.
- Physical material edits and family presets, including glass transmission/IOR, clearcoat and imported maps. Leather/carbon publication requires appropriate source texture maps. Multi-material nodes expose their material assignments.
- Data-driven groups/options for material, visibility, geometry variants, transforms, features and packages; shared compatibility rules and authoritative prices in integer minor units. Catalog order makes layered results deterministic.
- Procedural environment or validated uploaded Radiance HDRI, light types/transforms/temperature, floor settings, camera presets/lens, actual depth of field and quality tiers. Rendering pauses when idle.
- Accounts, hashed sessions, tenant/workspace roles, private assets, revision conflicts, version history and audit records. Server checks permissions and project references before writes or publication.
- Immutable published releases, customer runtime, saved configuration share links, branding, HTTPS embed-origin policy, unpublish and basic event totals. Draft changes do not alter existing releases.
- Native 1920×1080 PNG capture, configuration JSON and configured GLB export. Public GLB exports use persistent PostgreSQL jobs with worker leases and explicit status/errors; output is validated and separate from source.

## Supported asset profile

Imports are capped at 50 MiB, 5,000 nodes, hierarchy depth 128 and two million triangles. Server validation adds Khronos glTF checks, full PNG/JPEG decode, texture limits of 4,096 pixels per dimension/16 million pixels and 256 MiB estimated total decoded texture memory. HDRIs are bounded to 4,096×2,048 and 30 MiB. Processing is limited to two worker threads with heap and time budgets.

Use embedded PNG/JPEG images and self-contained buffers. External-resource glTF, sparse accessors, Draco, Meshopt, KTX2 and non-triangle primitives are rejected. Optional unknown extensions are warned about and may lose behavior on export. Animation editing, arbitrary texture replacement, mapping migration to a different asset and metadata JSON reimport are not implemented. The editor uses physical materials; imported unlit appearance requires further parity work. Saved camera presets/lens persist, but arbitrary orbit poses do not.

The tests use small synthetic meshes. No licensed production vehicle or product model is bundled. Real asset quality, Safari/device coverage and physical-device performance still require acceptance testing.

## Verification and deployment

```sh
npm test
npm run build
npm run test:e2e
npm run db:backup
```

Playwright uses installed Chromium with software WebGL in this workspace; otherwise install its managed Chromium or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. The suite starts the API and Vite. `db:backup` atomically saves an ignored local PostgreSQL snapshot; filesystem assets remain under ignored `.data/assets`. See [deployment instructions](docs/DEPLOYMENT.md) for Docker, migrations, first-owner provisioning and production limitations.
