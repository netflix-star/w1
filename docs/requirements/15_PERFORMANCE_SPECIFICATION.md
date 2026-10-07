# Performance Specification

## Measure
Initial load, interactive time, model load, FPS, frame time, draw calls, triangles, texture memory, bundle size, network transfer and memory growth.

## Optimization
GLB, Meshopt/Draco, KTX2/Basis, mipmaps, LOD, lazy loading, CDN and selective preloading.

## Stress Test
Repeatedly load → configure → switch materials → switch environment → capture → reset. Check for memory leaks, stale GPU resources and FPS degradation.

Provide adaptive performance/balanced/high/ultra modes where appropriate.
