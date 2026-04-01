import {
	foreignKey,
	pgTable,
	primaryKey,
	serial,
	text,
} from "drizzle-orm/pg-core";

export const competitors = pgTable("competitors", {
	wca_id: text().primaryKey(),
	name: text().notNull(),
	home_country: text().notNull(),
	home_continent: text().notNull(),
});

export const regions = pgTable(
	"regions",
	{
		continent: text(),
		country: text(),
		state: text(),
		us_region: text(),
		total_competitions: serial().notNull(),
	},
	(table) => [primaryKey({ columns: [table.country, table.state] })],
);

export const competitor_regions = pgTable(
	"competitor_regions",
	{
		competitor_id: text().notNull(),
		country: text().notNull(),
		state: text().notNull(),
		visit_count: serial().notNull(),
		first_competition_id: text().notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.competitor_id, table.country, table.state],
		}),
		foreignKey({
			columns: [table.country, table.state],
			foreignColumns: [regions.country, regions.state],
			name: "fk_regions_competitor_regions",
		}),
	],
);
