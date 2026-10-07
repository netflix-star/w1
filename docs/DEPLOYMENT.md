# Deployment and operations

## Tested local container

The `forma-platform:local` image was built and run as the non-root `node` user against PostgreSQL 17 and LocalStack S3 over a Docker network. `npx tsx scripts/container-smoke.ts` passed authentication, private upload/read, publication, configured export worker output, HTML/CSP and archive denial. The smoke script creates a disposable account/project and accepts only local origins. It requires development registration enabled and is not a production account-provisioning tool.

```sh
docker build -t forma-platform:local .
```

If a trusted corporate proxy requires its own CA, pass predefined `HTTP_PROXY`/`HTTPS_PROXY` build arguments and `--secret id=ca_cert,src=/path/to/trusted-ca.pem`. The Dockerfile mounts that CA only while installing packages. Do not disable TLS verification or store proxy credentials in the Dockerfile. The cloud build also required resolving its proxy host explicitly with `--add-host`; that is specific to this environment.

## Production prerequisites

Provision PostgreSQL, a private S3-compatible bucket and an HTTPS reverse proxy/domain. Populate a protected environment file from `.env.example` or use your deployment secret manager. Keep database and storage credentials server-side. Set:

- `NODE_ENV=production`, `STORAGE_DRIVER=s3`, `API_PORT=3001`.
- `DATABASE_URL` with the provider's required TLS connection settings.
- `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`. The current adapter uses path-style addressing and region `us-east-1`; select a compatible provider. Scope access to this bucket, including conditional writes, reads and cleanup deletes. Pre-create it when bucket-creation permission is unavailable.
- `PUBLIC_ORIGIN` and exact comma-separated `APP_ORIGINS` to the HTTPS application origin. Unsafe requests require a matching Origin header. Do not include embed host origins here unless they actually host the application.
- `REGISTRATION_ENABLED=false` for controlled launch. `TRUST_PROXY_HOPS` must match the trusted ingress topology (default zero, maximum three). Block direct client access that could spoof proxy headers.

A reverse proxy must forward requests to the container, preserve Origin/Host and correctly supply trusted forwarding headers. Allow bounded 50 MiB model uploads and 30 MiB HDR uploads; the server also checks limits. Keep the asset bucket private. Serve only the API-mediated authorized/public release endpoints. The application serves hashed frontend assets itself; using Vite preview as the production API is unsupported.

Run migrations once per deployment before starting replicas:

```sh
docker run --rm --env-file /secure/path/forma.env \
  forma-platform:local node --import tsx server/migrate.ts
```

Migration execution takes an advisory database lock and uses transactions. For an empty installation, create the first owner using a protected bootstrap environment file containing `BOOTSTRAP_EMAIL` and a unique `BOOTSTRAP_PASSWORD` of at least 16 characters, in addition to the normal server settings:

```sh
docker run --rm --env-file /secure/path/forma-bootstrap.env \
  forma-platform:local node --import tsx server/bootstrap.ts
```

Remove the bootstrap password from runtime configuration after provisioning. Bootstrap refuses a database with any users. There is no password-recovery/email-verification service yet. Membership assignment requires existing registered users; broader account provisioning and recovery remain launch work.

Start the application on a private ingress port:

```sh
docker run -d --name forma --restart unless-stopped \
  --env-file /secure/path/forma.env -p 127.0.0.1:3001:3001 \
  forma-platform:local
```

The database and S3 endpoint must be reachable from the container; container-local `127.0.0.1` does not refer to host services. Use a deployment network/provider endpoint. The Docker health check requests `/api/health`; this checks database connectivity. Storage is checked at startup. Health checks do not certify recovery or all schema/storage permissions.

## Publication, caching and retention

Releases snapshot saved project metadata and source asset IDs. Later edits create another release. The database prevents updates/deletes of release records. Unpublish/archive disables subsequent manifest/asset/configuration/export requests; it cannot recall assets already downloaded or cached. Do not promise confidential content becomes recoverable after publication. Share configuration IDs intentionally allow public reading while their release is published.

Frontend hashed assets use immutable caching. Published HTML uses no-store and a release-specific CSP `frame-ancestors` allowlist. Authoring HTML allows same-origin embedding only. Configure HTTPS embed origins in project metadata before publishing. The renderer can be exported from published releases without an author account.

Export jobs are database-backed with leases and at most three expired-lease attempts. Files become inaccessible after one day. Automatic object/session retention cleanup is not implemented yet; configure operational cleanup carefully and never delete source assets referenced by retained releases. Archive is a logical operation, not personal-data erasure. Rate limits are per-process; multiple replicas need shared limits at ingress.

## Backups and recovery

For local development, `npm run db:backup` atomically writes `.data/postgres-snapshot.sql`. `npm run services` restores it only when creating a new PostgreSQL container. Preserve `.data/assets` and `.env` with the database snapshot; database rows alone do not contain original assets. Named Docker volumes alone do not establish cloud snapshot restoration.

Production needs scheduled encrypted PostgreSQL backups, bucket versioning/backup, scoped restore credentials and an exercised restore procedure matching database asset references. Test restoring to an isolated installation before claiming recovery readiness. Do not roll back database schemas by deleting migration records; assess compatibility and restore from a tested backup where needed.

## Release gates still open

A public hostname, production credentials and TLS deployment have not been selected or exercised. Worker threads enforce heap/time/concurrency bounds but are not OS isolation for untrusted native image/model decoding. Real-asset rendering/export parity, browser/device performance, account recovery and retention automation remain open. See [implementation status](IMPLEMENTATION_PLAN.md) and the original production checklist.
