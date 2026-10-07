# Implementation status

The updated production ZIP defines a general configurator platform. Its documents are requirements, not additional authorization to send messages, obtain credentials or publish externally. The user's instruction authorizes development. No external deployment has been performed.

## Implemented architecture

| Area | Main files | Current behavior |
| --- | --- | --- |
| Authoring | `src/AuthorApp.tsx`, `CloudPanel.tsx`, authoring panels | Import, inspect/map, physical materials, data-driven options/rules, studio, workspace saves |
| Asset pipeline | `src/importer.ts`, `gltf.ts`, `server/asset-worker.mjs` | Structural bounds, self-contained normalization, Khronos validation, decoded image/HDR budgets |
| Shared data | `src/project.ts`, `domain.ts`, `materials.ts`, `studio.ts` | Versioned schema, stable IDs, deterministic selection/rules, minor-unit pricing, presets |
| Rendering | `src/model.ts`, `Viewport.tsx` | Material/config application, demand rendering, environment/light/camera/DOF, native PNG capture |
| API/auth/storage | `server/main.ts`, `auth.ts`, `db.ts`, `storage.ts`, migrations | Tenant roles, private immutable objects, versioned writes, sessions, audit records, archive |
| Publishing/runtime | `PublishingPanel.tsx`, `Runtime.tsx` | Immutable manifests, publish/unpublish, configure/share/embed, basic analytics |
| Export | `configured-export.ts`, `server/jobs.ts` | Configured geometry/material export, PostgreSQL queue and leases, validated derived output |
| Operations | `Dockerfile`, `scripts/`, CI workflow | Non-root container, local services, migration/bootstrap/backup, automated verification |

## Verified milestones

Local and authenticated import → author → save/reload → publish → independently configure → share/restore → configured export are exercised by automated tests. Tenant denial, role enforcement, revision conflicts, unsafe origins, revoked sessions, invalid assets and unpublish/archive protections are covered. The Docker image is also exercised using actual PostgreSQL and S3 protocol storage.

## Remaining work before broad production launch

1. **Deployment and operations:** select domain/host, provision managed PostgreSQL/private S3 and HTTPS, configure scoped credentials, run migration/bootstrap, test backups/restoration and monitoring. Current local services do not establish public availability or recovery guarantees.
2. **Identity:** password recovery, email verification, account lifecycle and production team provisioning/SSO. Membership assignment currently requires an already registered user. Production registration is disabled by default; first owner uses the bootstrap command.
3. **Asset processing:** move public untrusted decoding into an OS-isolated service with network denial and native-memory/CPU limits. Worker-thread heap limits do not constrain all native allocations. Add compressed texture/mesh pipelines, multi-scene authoring and robust real-asset compatibility coverage.
4. **Authoring parity:** source unlit material parity; arbitrary camera poses; texture upload/assignment tooling; richer catalog/variant workflows and preset thumbnails; archive/restore management UI and migration of mappings across new source versions.
5. **Lifecycle:** object cleanup/retention for expired exports and abandoned uploads, expired sessions, archived projects and intentional data erasure. Export files become inaccessible after one day but are not automatically removed from storage yet.
6. **Acceptance/performance:** representative licensed product assets, textured/animated export visual parity, cross-browser/device tests, measured Web Vitals/GPU/texture budgets and CDN delivery. Shared WebGL code still produces a large-chunk warning. Current software WebGL tests cannot establish mobile performance.

The original [production readiness checklist](requirements/18_PRODUCTION_READINESS_CHECKLIST.md) remains unmodified. Passing the current tests does not satisfy every requirement in that checklist.
