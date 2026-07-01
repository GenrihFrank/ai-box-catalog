export const DATABASE_NAME = 'ai-box-catalog.db';

export const CURRENT_SCHEMA_VERSION = 1;

export type Migration = {
  version: number;
  sql: string;
};

export const migrations: Migration[] = [
  {
    version: 1,
    sql: `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS boxes (
  id TEXT PRIMARY KEY NOT NULL,
  number INTEGER NOT NULL UNIQUE,
  label TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY NOT NULL,
  box_id TEXT NOT NULL,
  name TEXT NOT NULL,
  aliases_json TEXT NOT NULL DEFAULT '[]',
  attributes_json TEXT NOT NULL DEFAULT '{}',
  source TEXT NOT NULL CHECK (source IN ('manual', 'ai_confirmed')),
  source_suggestion_id TEXT,
  source_photo_ids_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (box_id) REFERENCES boxes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS box_photos (
  id TEXT PRIMARY KEY NOT NULL,
  box_id TEXT NOT NULL,
  local_uri TEXT NOT NULL,
  thumbnail_uri TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  byte_size INTEGER NOT NULL,
  taken_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (box_id) REFERENCES boxes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS extraction_jobs (
  id TEXT PRIMARY KEY NOT NULL,
  box_id TEXT NOT NULL,
  photo_ids_json TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('mock', 'on-device-vlm', 'local-desktop-vlm', 'cloud-vlm')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'needs_review', 'failed', 'applied')),
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (box_id) REFERENCES boxes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS item_suggestions (
  id TEXT PRIMARY KEY NOT NULL,
  job_id TEXT NOT NULL,
  name TEXT NOT NULL,
  attributes_json TEXT NOT NULL DEFAULT '{}',
  source_photo_ids_json TEXT NOT NULL DEFAULT '[]',
  reason TEXT,
  selected_by_default INTEGER NOT NULL CHECK (selected_by_default IN (0, 1)),
  status TEXT NOT NULL CHECK (status IN ('active', 'edited', 'deleted', 'applied')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES extraction_jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_items_box_id ON items(box_id);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_deleted_at ON items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_box_photos_box_id ON box_photos(box_id);
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_box_status ON extraction_jobs(box_id, status);
CREATE INDEX IF NOT EXISTS idx_item_suggestions_job_status ON item_suggestions(job_id, status);
`
  }
];
