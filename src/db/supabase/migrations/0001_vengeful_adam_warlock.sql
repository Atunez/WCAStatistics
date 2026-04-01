ALTER TABLE "competitor_regions" ALTER COLUMN "competitor_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "competitor_regions" ALTER COLUMN "first_competition_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "competitors" ALTER COLUMN "wca_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "regions" ADD COLUMN "total_competitions" serial NOT NULL;