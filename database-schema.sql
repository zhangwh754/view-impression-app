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
