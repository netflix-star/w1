CREATE TABLE export_jobs(id uuid PRIMARY KEY, release_id uuid NOT NULL REFERENCES releases(id), state jsonb NOT NULL, status text NOT NULL CHECK(status IN ('queued','processing','complete','failed')), output_key text, byte_size bigint, error text, lease_until timestamptz, attempts integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '1 day');
CREATE INDEX export_jobs_queue ON export_jobs(status,created_at);
INSERT INTO schema_migrations(version) VALUES('003_export_jobs');
