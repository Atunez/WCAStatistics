DO $$
BEGIN
  CREATE TYPE "public"."wca_export_run_status" AS ENUM (
    'started',
    'succeeded',
    'failed',
    'skipped'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "wca_export_runs" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY NOT NULL,
  "export_date" timestamp with time zone NOT NULL,
  "export_format_version" text NOT NULL,
  "tsv_url" text NOT NULL,
  "status" "wca_export_run_status" NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "finished_at" timestamp with time zone,
  "error" text,
  "people_count" integer DEFAULT 0 NOT NULL,
  "competitions_count" integer DEFAULT 0 NOT NULL,
  "person_competition_pairs_count" integer DEFAULT 0 NOT NULL,
  "states_mapped_count" integer DEFAULT 0 NOT NULL,
  "skipped_reason" text
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "wca_people" (
  "wca_id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "country_id" text NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "us_competitions" (
  "competition_id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "city_name" text NOT NULL,
  "venue_address" text,
  "state_code" text NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "cancelled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "person_us_competitions" (
  "wca_id" text NOT NULL,
  "competition_id" text NOT NULL,
  CONSTRAINT "person_us_competitions_wca_id_competition_id_pk"
    PRIMARY KEY("wca_id", "competition_id")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "person_us_state_summary" (
  "wca_id" text PRIMARY KEY NOT NULL,
  "visited_states_count" integer NOT NULL,
  "us_competitions_count" integer NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  ALTER TABLE "person_us_competitions"
    ADD CONSTRAINT "person_us_competitions_wca_id_wca_people_wca_id_fk"
    FOREIGN KEY ("wca_id")
    REFERENCES "public"."wca_people"("wca_id")
    ON DELETE cascade
    ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  ALTER TABLE "person_us_competitions"
    ADD CONSTRAINT "person_us_competitions_competition_id_us_competitions_competition_id_fk"
    FOREIGN KEY ("competition_id")
    REFERENCES "public"."us_competitions"("competition_id")
    ON DELETE cascade
    ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  ALTER TABLE "person_us_state_summary"
    ADD CONSTRAINT "person_us_state_summary_wca_id_wca_people_wca_id_fk"
    FOREIGN KEY ("wca_id")
    REFERENCES "public"."wca_people"("wca_id")
    ON DELETE cascade
    ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "wca_export_runs_export_date_unique"
  ON "wca_export_runs" USING btree ("export_date");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "wca_export_runs_status_started_idx"
  ON "wca_export_runs" USING btree ("status", "started_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "person_us_competitions_wca_id_idx"
  ON "person_us_competitions" USING btree ("wca_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "person_us_state_summary_rank_idx"
  ON "person_us_state_summary" USING btree ("visited_states_count", "wca_id");
