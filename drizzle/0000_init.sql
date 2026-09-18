CREATE TYPE "public"."note_source" AS ENUM('ai', 'demo', 'manual');--> statement-breakpoint
CREATE TYPE "public"."note_status" AS ENUM('draft', 'final');--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "note_status" DEFAULT 'draft' NOT NULL,
	"source" "note_source" NOT NULL,
	"transcript" text NOT NULL,
	"redaction_counts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finalized_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "notes_workspace_updated_idx" ON "notes" USING btree ("workspace_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notes_title_search_idx" ON "notes" USING gin (to_tsvector('english', "title"));