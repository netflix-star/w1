# Configuration Rule Engine

## Rules
Support requires, excludes, variant-only, mutually-exclusive, quantity and package-dependency rules.

## Resolution
On selection: update candidate state → evaluate rules → reject or resolve invalid combinations → recalculate price → update runtime.

## Determinism
The same published release plus the same configuration JSON must always resolve to the same result.

Rules must be validated server-side before publication and persistence.
