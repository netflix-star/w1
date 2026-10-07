ALTER TABLE assets ADD COLUMN source_asset_id uuid REFERENCES assets(id);
INSERT INTO schema_migrations(version) VALUES('002_source_assets');
