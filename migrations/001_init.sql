-- Ascend Ticket Bot - Database Schema
-- Run this once to initialise your PostgreSQL database

CREATE TABLE IF NOT EXISTS ticket_config (
  guild_id         TEXT    PRIMARY KEY,
  panel_channel_id TEXT,
  panel_message_id TEXT,
  ticket_counter   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tickets (
  id                    SERIAL      PRIMARY KEY,
  ticket_number         INTEGER     NOT NULL,
  guild_id              TEXT        NOT NULL,
  thread_id             TEXT        NOT NULL UNIQUE,
  user_id               TEXT        NOT NULL,
  type                  TEXT        NOT NULL,   -- general | prize | report
  status                TEXT        NOT NULL DEFAULT 'open',  -- open | closed
  transcript_message_id TEXT,
  opened_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at             TIMESTAMPTZ
);
