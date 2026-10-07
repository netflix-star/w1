# GLB and Export Specification

## Exports
1. Configuration JSON
2. Rendered image
3. Configured GLB where technically supported
4. Embed/share information

## Configured GLB
Load exact release → resolve configuration → apply geometry/material/visibility state → export → validate output → provide file.

The export must not simply return the original unconfigured GLB.

Large exports should use asynchronous jobs with queued/processing/complete/failed states.
