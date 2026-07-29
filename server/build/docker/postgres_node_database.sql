CREATE DATABASE mattermost_node_test;
GRANT ALL PRIVILEGES ON DATABASE mattermost_node_test TO mmuser;

-- postgres.conf sets default_text_search_config = 'pg_catalog.korean', but the
-- stock postgres/pgvector images ship no such configuration, so every new
-- connection logs "invalid value for parameter" and falls back silently.
-- Create it as a copy of 'simple' wherever it is missing. template1 is covered
-- so databases created later (e.g. dump restores) inherit it.
\c template1
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'korean') THEN
    CREATE TEXT SEARCH CONFIGURATION pg_catalog.korean (COPY = pg_catalog.simple);
  END IF;
END
$$;

\c postgres
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'korean') THEN
    CREATE TEXT SEARCH CONFIGURATION pg_catalog.korean (COPY = pg_catalog.simple);
  END IF;
END
$$;

-- Enable pgvector extension
\c mattermost_test
CREATE EXTENSION IF NOT EXISTS vector;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'korean') THEN
    CREATE TEXT SEARCH CONFIGURATION pg_catalog.korean (COPY = pg_catalog.simple);
  END IF;
END
$$;

\c mattermost_node_test
CREATE EXTENSION IF NOT EXISTS vector;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'korean') THEN
    CREATE TEXT SEARCH CONFIGURATION pg_catalog.korean (COPY = pg_catalog.simple);
  END IF;
END
$$;
