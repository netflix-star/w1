# PBR Material Editor

## Material Definition
A material can define base color, metallic, roughness, normal, clearcoat, clearcoat roughness, transmission and IOR where appropriate.

## Texture Support
Use proper color spaces, mipmaps and GPU-friendly compressed formats such as KTX2/Basis where supported.

## Required Material Families
Automotive paint, metal, glass, leather, carbon fiber and rubber.

## Runtime Rule
Material edits must update the actual renderer and persist in the project configuration.

A simple `material.color` swap is not sufficient for a production automotive PBR material when additional physical properties/textures are required.
