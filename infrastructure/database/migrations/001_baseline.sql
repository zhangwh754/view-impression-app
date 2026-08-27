DO $migration$
DECLARE
  watched_at_type TEXT;
BEGIN
  CREATE TABLE IF NOT EXISTS works (
    id SERIAL PRIMARY KEY,
    source VARCHAR(20) NOT NULL,
    source_id VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    original_title TEXT,
    type VARCHAR(20) NOT NULL,
    cover_url TEXT,
    creator TEXT,
    year VARCHAR(10),
    external_rating REAL,
    episodes INTEGER,
    synopsis TEXT,
    genres TEXT,
    cast_members TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (source, source_id)
  );

  ALTER TABLE works ADD COLUMN IF NOT EXISTS genres TEXT;
  ALTER TABLE works ADD COLUMN IF NOT EXISTS cast_members TEXT;

  CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    work_id INTEGER NOT NULL REFERENCES works (id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    my_rating REAL,
    comment TEXT,
    watched_at TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  SELECT data_type INTO watched_at_type
  FROM information_schema.columns
  WHERE table_schema = current_schema()
    AND table_name = 'reviews'
    AND column_name = 'watched_at';

  IF watched_at_type = 'date' THEN
    ALTER TABLE reviews
      ALTER COLUMN watched_at TYPE TEXT USING left(watched_at::text, 7);
  END IF;
END
$migration$;
