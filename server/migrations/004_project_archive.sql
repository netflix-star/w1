ALTER TABLE projects ADD COLUMN archived_at timestamptz;
INSERT INTO schema_migrations(version) VALUES('004_project_archive');
