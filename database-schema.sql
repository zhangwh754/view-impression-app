-- PostgreSQL structure-only export generated from live database metadata.
-- No application data is included.

CREATE TABLE public."User" (
  id serial PRIMARY KEY,
  email text NOT NULL,
  name text,
  CONSTRAINT "User_email_key" UNIQUE (email)
);

CREATE TABLE public."Post" (
  id serial PRIMARY KEY,
  title text NOT NULL,
  content text,
  published boolean DEFAULT false,
  "authorId" integer,
  CONSTRAINT "Post_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES public."User" (id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE public.works (
  id serial PRIMARY KEY,
  source varchar(20) NOT NULL,
  source_id varchar(50) NOT NULL,
  title text NOT NULL,
  original_title text,
  type varchar(20) NOT NULL,
  cover_url text,
  creator text,
  year varchar(10),
  external_rating real,
  episodes integer,
  synopsis text,
  created_at timestamptz DEFAULT now(),
  genres text,
  cast_members text,
  CONSTRAINT works_source_source_id_key UNIQUE (source, source_id)
);

CREATE TABLE public.reviews (
  id serial PRIMARY KEY,
  work_id integer NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'completed',
  my_rating real,
  comment text,
  watched_at text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT reviews_work_id_fkey
    FOREIGN KEY (work_id) REFERENCES public.works (id)
    ON DELETE CASCADE
);

CREATE TABLE public.showcase (
  id smallint PRIMARY KEY DEFAULT 1,
  title text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT showcase_singleton_check CHECK (id = 1)
);

CREATE TABLE public.showcase_slots (
  id serial PRIMARY KEY,
  showcase_id smallint NOT NULL DEFAULT 1,
  label text NOT NULL,
  work_id integer,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT showcase_slots_showcase_id_fkey
    FOREIGN KEY (showcase_id) REFERENCES public.showcase (id)
    ON DELETE CASCADE,
  CONSTRAINT showcase_slots_work_id_fkey
    FOREIGN KEY (work_id) REFERENCES public.works (id)
    ON DELETE SET NULL,
  CONSTRAINT showcase_slots_position_unique UNIQUE (showcase_id, position)
);

CREATE TABLE public._prisma_migrations (
  id varchar(36) PRIMARY KEY,
  checksum varchar(64) NOT NULL,
  finished_at timestamptz,
  migration_name varchar(255) NOT NULL,
  logs text,
  rolled_back_at timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  applied_steps_count integer NOT NULL DEFAULT 0
);
