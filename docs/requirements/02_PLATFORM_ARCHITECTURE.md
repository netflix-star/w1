# Platform Architecture

```text
Authoring Studio
      |
      v
Project/API Layer
      |
      +--> PostgreSQL
      +--> Object Storage
      +--> Asset Processing
      +--> Publish Service
      |
      v
Configuration Runtime
      |
      v
Three.js/WebGL/WebGPU Renderer
      |
      v
Published Experience
```

## Recommended Stack
React + TypeScript + Three.js/React Three Fiber + Zustand + Node.js/TypeScript + PostgreSQL + object storage/CDN.

## Architecture Rules
UI must not own authoritative pricing, permissions, publishing or compatibility rules.

New vehicles/projects should be introduced through assets and configuration data, not custom code.

Drafts are mutable. Published releases are immutable snapshots.

Every project belongs to a tenant/workspace and must be authorized server-side.
