-- Add SavedSentence table for "scene builder" saved sentences
-- Safe to run multiple times.

DO $$ BEGIN
  CREATE TYPE "SavedSentenceSource" AS ENUM ('USER', 'SUGGESTED', 'EVAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "SavedSentence" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "word"      TEXT        NOT NULL,
  "scene"     TEXT        NOT NULL,
  "sentence"  TEXT        NOT NULL,
  "source"    "SavedSentenceSource" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "SavedSentence_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SavedSentence_word_fkey" FOREIGN KEY ("word") REFERENCES "UserWord"("word") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SavedSentence_word_scene_sentence_key" UNIQUE ("word","scene","sentence")
);

CREATE INDEX IF NOT EXISTS "SavedSentence_word_idx" ON "SavedSentence" ("word");
CREATE INDEX IF NOT EXISTS "SavedSentence_word_scene_idx" ON "SavedSentence" ("word","scene");


