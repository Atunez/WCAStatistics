import { relations } from "drizzle-orm/relations";
import { regions, competitorRegions } from "./schema";

export const competitorRegionsRelations = relations(competitorRegions, ({one}) => ({
	region: one(regions, {
		fields: [competitorRegions.country],
		references: [regions.country]
	}),
}));

export const regionsRelations = relations(regions, ({many}) => ({
	competitorRegions: many(competitorRegions),
}));