CREATE TABLE "competitor_regions" (
	"competitor_id" serial NOT NULL,
	"country" text NOT NULL,
	"state" text NOT NULL,
	"visit_count" serial NOT NULL,
	"first_competition_id" serial NOT NULL,
	CONSTRAINT "competitor_regions_competitor_id_country_state_pk" PRIMARY KEY("competitor_id","country","state")
);
--> statement-breakpoint
CREATE TABLE "competitors" (
	"wca_id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"home_country" text NOT NULL,
	"home_continent" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"continent" text,
	"country" text,
	"state" text,
	"us_region" text,
	CONSTRAINT "regions_country_state_pk" PRIMARY KEY("country","state")
);
--> statement-breakpoint
ALTER TABLE "competitor_regions" ADD CONSTRAINT "fk_regions_competitor_regions" FOREIGN KEY ("country","state") REFERENCES "public"."regions"("country","state") ON DELETE no action ON UPDATE no action;