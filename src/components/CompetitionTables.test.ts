import { describe, expect, it } from "vitest";
import type { CompetitionSummary, RegionCoverage } from "#/lib/wca-types";
import {
	buildCompetitionStatusRows,
	filterCompetitionStatusRows,
} from "./CompetitionTables";

function makeCompetition(
	id: string,
	name: string,
	city: string,
	startDate: string,
	endDate = startDate,
): CompetitionSummary {
	return {
		id,
		name,
		city,
		regionCode: "CA",
		regionName: "California",
		startDate,
		endDate,
		wcaUrl: `https://www.worldcubeassociation.org/competitions/${id}`,
	};
}

const visitedRegions: RegionCoverage[] = [
	{
		regionCode: "CA",
		regionName: "California",
		recentCompetitions: [
			makeCompetition(
				"CaliforniaOpen2025",
				"California Open 2025",
				"Los Angeles",
				"2025-05-03",
			),
			makeCompetition(
				"CaliforniaSpring2024",
				"California Spring 2024",
				"San Jose",
				"2024-03-10",
			),
		],
		upcomingCompetitions: [
			makeCompetition(
				"CaliforniaSummer2026",
				"California Summer 2026",
				"San Diego",
				"2026-06-14",
			),
		],
	},
];

const unvisitedRegions: RegionCoverage[] = [
	{
		regionCode: "NV",
		regionName: "Nevada",
		recentCompetitions: [],
		upcomingCompetitions: [
			{
				...makeCompetition(
					"NevadaOpen2026",
					"Nevada Open 2026",
					"Reno",
					"2026-08-02",
				),
				regionCode: "NV",
				regionName: "Nevada",
			},
		],
	},
];

describe("CompetitionTables helpers", () => {
	it("builds visited and remaining rows with the leading competition entries", () => {
		const rows = buildCompetitionStatusRows(
			visitedRegions,
			unvisitedRegions,
		);

		expect(rows).toHaveLength(2);
		expect(rows[0]).toMatchObject({
			regionCode: "CA",
			regionName: "California",
			status: "visited",
			recentCompetitionsCount: 2,
			upcomingCompetitionsCount: 1,
			recentCompetition: {
				id: "CaliforniaOpen2025",
			},
			upcomingCompetition: {
				id: "CaliforniaSummer2026",
			},
		});
		expect(rows[1]).toMatchObject({
			regionCode: "NV",
			regionName: "Nevada",
			status: "remaining",
			recentCompetitionsCount: 0,
			upcomingCompetitionsCount: 1,
			recentCompetition: null,
			upcomingCompetition: {
				id: "NevadaOpen2026",
			},
		});
	});

	it("filters by region names and competition names", () => {
		const rows = buildCompetitionStatusRows(
			visitedRegions,
			unvisitedRegions,
		);

		expect(filterCompetitionStatusRows(rows, "nevada")).toHaveLength(1);
		expect(filterCompetitionStatusRows(rows, "summer 2026")).toHaveLength(
			1,
		);
		expect(filterCompetitionStatusRows(rows, "missing")).toHaveLength(0);
	});
});
