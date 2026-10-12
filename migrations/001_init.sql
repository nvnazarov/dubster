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
    date_created    TIMESTAMPTZ NOT NULL
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

-- CREATE INDEX IF NOT EXISTS idx_clips_author_id ON clips(author_id);
-- CREATE INDEX idx_
-- CREATE INDEX idx_clips_roles_number ON clips();
-- CREATE INDEX idx_sessions_participants ON sessions(participants);
