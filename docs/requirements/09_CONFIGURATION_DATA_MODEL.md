# Configuration Data Model

## Entities
Tenant, Workspace, Project, ProjectRelease, Model, Asset, NodeMapping, Material, MaterialVariant, OptionGroup, Option, Rule, Environment, LightingPreset, CameraPreset, Configuration, ConfigurationSnapshot, ExportJob.

## Example
```json
{
  "releaseId": "rel_102",
  "selections": {
    "paint": "paint_obsidian",
    "wheels": "wheel_forged_22",
    "interior": "interior_tan"
  }
}
```

Use stable IDs and schema/catalog versions. Published releases are immutable.
