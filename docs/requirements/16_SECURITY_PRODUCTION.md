# Security and Production Hardening

## Uploads
Validate actual content, enforce size limits, safely parse files, isolate processing and prevent path traversal.

## Authorization
Never trust client-supplied project IDs or tenant IDs. Verify ownership/membership on the server.

## Public Runtime
Only published releases are public. Draft assets remain protected.

## API
Authentication, authorization, schema validation, rate limiting, CORS, security headers and secure secrets.

Never place private API credentials in frontend bundles.
