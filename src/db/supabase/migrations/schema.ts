import {
	foreignKey,
	integer,
	pgTable,
	primaryKey,
	text,
} from "drizzle-orm/pg-core";

export const competitors = pgTable("competitors", {
	// WCA IDs are strings like '2015DOE01' — never use serial here
	wcaId: text("wca_id").primaryKey().notNull(),
	name: text().notNull(),
	homeCountry: text("home_country").notNull(),
	homeContinent: text("home_continent").notNull(),
});

export const regions = pgTable(
	"regions",
	{
		country: text().notNull(),
		state: text().notNull(),
		name: text().notNull(),
		type: text().notNull(), // 'state', 'province' etc.
		continent: text(), // nullable is fine
		usRegion: text("us_region"), // nullable — only applies to US
		// Removed totalCompetitions —  is derived data, compute it at query time
	},
	(table) => [
		primaryKey({
			columns: [table.country, table.state],
			name: "regions_pk",
		}),
	],
);

export const competitorRegions = pgTable(
	"competitor_regions",
	{
		// Must be text to match competitors.wcaId
		competitorId: text("competitor_id").notNull(),
		country: text().notNull(),
		state: text().notNull(),
		// plain integer — serial means auto-increment which makes no sense here
		visitCount: integer("visit_count").default(1).notNull(),
		// competition IDs are strings, not auto-increment integers
		firstCompetitionId: text("first_competition_id"),
	},
	(table) => [
		// FK to competitors
		foreignKey({
			columns: [table.competitorId],
			foreignColumns: [competitors.wcaId],
			name: "fk_competitor_regions_competitor",
		}),
		// FK to regions
		foreignKey({
			columns: [table.country, table.state],
			foreignColumns: [regions.country, regions.state],
			name: "fk_competitor_regions_region",
		}),
		primaryKey({
			columns: [table.competitorId, table.country, table.state],
			name: "competitor_regions_pk",
		}),
	],
);
