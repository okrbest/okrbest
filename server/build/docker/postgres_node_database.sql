CREATE DATABASE mattermost_node_test;
GRANT ALL PRIVILEGES ON DATABASE mattermost_node_test TO mmuser;

-- Enable pgvector extension
\c mattermost_test
CREATE EXTENSION IF NOT EXISTS vector;

\c mattermost_node_test
CREATE EXTENSION IF NOT EXISTS vector;
