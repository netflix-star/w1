# Validation evidence

Validated in this workspace on 2026-10-07 with Node 24.19.0/npm 11.9.0 and installed Chromium using software WebGL. The Docker runtime uses Node 24 on Debian slim.

- **24 unit tests passed:** import boundaries and references, glTF normalization, shared rules/pricing and configured binary export, including matrix-transform preservation.
- **12 browser/API tests passed:** local authoring/reload/export; failed-import preservation; mobile layout; real shadow/quality/lens/DOF renderer state; repeated edit resource counts; bulk mapping/glass export; tenant/role enforcement; conflicting revisions; immutable publication; pricing tamper denial; shared configuration restoration; invalid content and full-validator rejection; origin/session protection; preserved glTF bytes; private/published HDRI; queued configured exports; CSP/archive/unpublish; decoded texture limits; publication texture prerequisites; author-to-customer flow in separate browser contexts.
- **Production build passed:** frontend and server TypeScript plus Vite. Entry approximately 226 kB/70 kB gzip; shared WebGL chunk approximately 737 kB/193 kB gzip. Author/runtime, GLB exporter and area-light data load separately. Large-chunk warning remains.
- **S3 adapter smoke passed:** private write/read byte equality and conditional immutable overwrite rejection using LocalStack.
- **Non-root Docker build passed:** locked production dependencies, compiled static frontend and server processing modules. A container file-ownership issue found during validation was fixed.
- **Docker integration smoke passed:** static frontend/CSP, real PostgreSQL accounts/revisions, private S3 upload and byte-for-byte read, immutable publication, Khronos-validated configured export in a worker and archive denial.
- **Local backup passed:** PostgreSQL dump written atomically to ignored `.data/postgres-snapshot.sql`. Restore is implemented for a newly created local database, but full fresh-task snapshot restoration and production recovery have not been independently exercised.

Commands are listed in README and DEPLOYMENT. Tests use isolated accounts/projects and small synthetic geometry; this is behavior evidence, not a security audit or production visual certification. Software rendering/mobile viewport emulation does not prove physical-device performance. Real production assets, browser matrix, OS-isolated workers and live HTTPS infrastructure remain acceptance work.

Cloud setup instructions are saved as a reviewable draft. Saving the draft does not publish the environment or deploy the application.
