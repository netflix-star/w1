# Project Asset Management

## Assets
Source GLB, derived GLB, textures, HDRIs, thumbnails, render outputs, logos and other licensed assets.

## Metadata
Asset ID, project ID, type, size, hash, MIME, processing state and source/derived relationship.

## Lifecycle
uploaded → validating → processing → ready/failed.

## Storage
Production assets should use object storage and CDN.

Source assets remain immutable. New uploads create new versions.
