# Multi-Tenant Architecture

```text
Tenant
 └── Workspace
      ├── Users
      ├── Projects
      ├── Assets
      └── Releases
```

## Roles
Owner, Admin, Editor, Viewer.

Every project operation must validate tenant/workspace membership and permissions server-side.

Private draft assets require authorization. Only explicitly published releases are public.

Audit upload, edit, publish, unpublish, export, deletion and permission events.
