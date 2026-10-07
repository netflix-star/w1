# GLB/GLTF Import Pipeline

## Pipeline
Upload → file validation → safe parsing → scene analysis → texture/material analysis → geometry metrics → dependency extraction → optimization → runtime asset build → CDN.

## Analyze
Record scenes, nodes, meshes, primitives, materials, textures, images, cameras, lights, animations, extensions, bounds, triangles, texture sizes and estimated memory.

## Stable Identity
Assign platform IDs to imported nodes/materials/assets. Display names must not be the only identity.

## Validation Report
Flag missing textures, unsupported extensions, excessive geometry, oversized textures, duplicate materials, invalid transforms, missing UVs and unsupported animation data.

## Security
Enforce size limits, validate actual content, prevent path traversal, safely process untrusted assets and isolate heavy processing.

The original source asset must remain immutable; optimized derivatives are separate assets.
