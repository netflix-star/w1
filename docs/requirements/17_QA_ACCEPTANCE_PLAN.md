# QA and Acceptance Plan

## Import
Test valid, malformed, oversized, missing-texture, unsupported-extension and high-poly GLBs.

## Authoring
Test node mapping, bulk mapping, material creation, option creation, rules, save and reload.

## Runtime
Verify every option changes the actual 3D scene, PBR response is correct, lighting/camera controls work and configuration is deterministic.

## Publishing
Broken projects must fail validation. Published URLs must work on another browser/device and reproduce the release.

## Export
JSON must contain correct selections. Images must match the configured scene. Configured GLB must contain the configured state where supported.

## Security
Test cross-tenant access, private draft access, authorization and manipulated client pricing.

## Performance
Test multiple device tiers and repeated sessions.

A button responding is not sufficient for PASS; underlying behavior must be verified.
