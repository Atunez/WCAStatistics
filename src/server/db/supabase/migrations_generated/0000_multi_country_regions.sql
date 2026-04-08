CREATE TYPE "public"."region_level" AS ENUM('country', 'subnational');--> statement-breakpoint
CREATE TYPE "public"."wca_export_run_status" AS ENUM('started', 'succeeded', 'failed', 'skipped');--> statement-breakpoint
CREATE TABLE "person_country_region_summary" (
	"wca_id" text NOT NULL,
	"country_iso2" text NOT NULL,
	"visited_regions_count" integer NOT NULL,
	"country_competitions_count" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "person_country_region_summary_wca_id_country_iso2_pk" PRIMARY KEY("wca_id","country_iso2")
);
--> statement-breakpoint
CREATE TABLE "person_regional_competitions" (
	"wca_id" text NOT NULL,
	"competition_id" text NOT NULL,
	CONSTRAINT "person_regional_competitions_wca_id_competition_id_pk" PRIMARY KEY("wca_id","competition_id")
);
--> statement-breakpoint
CREATE TABLE "person_us_competitions" (
	"wca_id" text NOT NULL,
	"competition_id" text NOT NULL,
	CONSTRAINT "person_us_competitions_wca_id_competition_id_pk" PRIMARY KEY("wca_id","competition_id")
);
--> statement-breakpoint
CREATE TABLE "person_us_state_summary" (
	"wca_id" text PRIMARY KEY NOT NULL,
	"visited_states_count" integer NOT NULL,
	"us_competitions_count" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regional_competitions" (
	"competition_id" text PRIMARY KEY NOT NULL,
	"country_iso2" text NOT NULL,
	"region_code" text NOT NULL,
	"name" text NOT NULL,
	"city_name" text NOT NULL,
	"venue_address" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"cancelled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "us_competitions" (
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
CREATE TABLE "wca_export_runs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "wca_export_runs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
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
CREATE TABLE "wca_people" (
	"wca_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wca_regions" (
	"country_iso2" text NOT NULL,
	"region_code" text NOT NULL,
	"region_name" text NOT NULL,
	"region_level" "region_level" NOT NULL,
	"is_selectable" boolean DEFAULT true NOT NULL,
	CONSTRAINT "wca_regions_country_iso2_region_code_pk" PRIMARY KEY("country_iso2","region_code")
);
--> statement-breakpoint
ALTER TABLE "person_country_region_summary" ADD CONSTRAINT "person_country_region_summary_wca_id_wca_people_wca_id_fk" FOREIGN KEY ("wca_id") REFERENCES "public"."wca_people"("wca_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_regional_competitions" ADD CONSTRAINT "person_regional_competitions_wca_id_wca_people_wca_id_fk" FOREIGN KEY ("wca_id") REFERENCES "public"."wca_people"("wca_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_regional_competitions" ADD CONSTRAINT "person_regional_competitions_competition_id_regional_competitions_competition_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."regional_competitions"("competition_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_us_competitions" ADD CONSTRAINT "person_us_competitions_wca_id_wca_people_wca_id_fk" FOREIGN KEY ("wca_id") REFERENCES "public"."wca_people"("wca_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_us_competitions" ADD CONSTRAINT "person_us_competitions_competition_id_us_competitions_competition_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."us_competitions"("competition_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_us_state_summary" ADD CONSTRAINT "person_us_state_summary_wca_id_wca_people_wca_id_fk" FOREIGN KEY ("wca_id") REFERENCES "public"."wca_people"("wca_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regional_competitions" ADD CONSTRAINT "regional_competitions_country_region_fk" FOREIGN KEY ("country_iso2","region_code") REFERENCES "public"."wca_regions"("country_iso2","region_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "person_country_region_summary_rank_idx" ON "person_country_region_summary" USING btree ("country_iso2","visited_regions_count","wca_id");--> statement-breakpoint
CREATE INDEX "person_regional_competitions_wca_id_idx" ON "person_regional_competitions" USING btree ("wca_id");--> statement-breakpoint
CREATE INDEX "person_regional_competitions_competition_id_idx" ON "person_regional_competitions" USING btree ("competition_id");--> statement-breakpoint
CREATE INDEX "person_us_competitions_wca_id_idx" ON "person_us_competitions" USING btree ("wca_id");--> statement-breakpoint
CREATE INDEX "person_us_state_summary_rank_idx" ON "person_us_state_summary" USING btree ("visited_states_count","wca_id");--> statement-breakpoint
CREATE INDEX "regional_competitions_country_region_start_idx" ON "regional_competitions" USING btree ("country_iso2","region_code","start_date");--> statement-breakpoint
CREATE INDEX "regional_competitions_country_start_idx" ON "regional_competitions" USING btree ("country_iso2","start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "wca_export_runs_export_date_unique" ON "wca_export_runs" USING btree ("export_date");--> statement-breakpoint
CREATE INDEX "wca_export_runs_status_started_idx" ON "wca_export_runs" USING btree ("status","started_at");--> statement-breakpoint
CREATE INDEX "wca_regions_country_selectable_idx" ON "wca_regions" USING btree ("country_iso2","is_selectable");