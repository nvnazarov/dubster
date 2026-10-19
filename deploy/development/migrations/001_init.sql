CREATE TABLE IF NOT EXISTS clips(
    id              VARCHAR(256) PRIMARY KEY,
    author_id       VARCHAR(256) NOT NULL,
    title           VARCHAR(128) NOT NULL,
    description     VARCHAR(2048),
    segments        JSONB NOT NULL,
    rating          REAL,
    roles           JSONB NOT NULL,
    verified        BOOLEAN NOT NULL,
    date_verified   TIMESTAMPTZ,
    date_created    TIMESTAMPTZ NOT NULL,
    deleted         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS sessions(
    id              VARCHAR(256) PRIMARY KEY,
    clip_id         VARCHAR(256) NOT NULL REFERENCES clips(id),
    host_id         VARCHAR(256) NOT NULL,
    participants    JSONB NOT NULL,
	actors          JSONB NOT NULL,
	grades          JSONB,
	finished        BOOLEAN NOT NULL,
    rendered        BOOLEAN NOT NULL,
    date_created    TIMESTAMPTZ NOT NULL,
	date_started    TIMESTAMPTZ,
	date_finished   TIMESTAMPTZ,
	date_graded     TIMESTAMPTZ,
	date_rendered   TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION jsonb_object_key_count(obj JSONB)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
STRICT
AS $$
    SELECT COUNT(*)::INTEGER
    FROM jsonb_object_keys(obj);
$$;

-- Index for searches by author with optional rating sort. 
CREATE INDEX idx_clips_author_rating ON clips (author_id, rating DESC NULLS LAST, id ASC) WHERE deleted = FALSE;

-- Indexes for global searches by rating.
CREATE INDEX idx_clips_rating_desc ON clips (rating DESC NULLS LAST, id ASC) WHERE deleted = FALSE;

-- Index for number of roles in a clip.
CREATE INDEX idx_clips_number_of_roles ON clips (jsonb_object_key_count(roles)) WHERE deleted = FALSE;

-- Case-insensitive substring search on title.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_clips_title_trgm ON clips USING GIN (title gin_trgm_ops) WHERE deleted = FALSE;
