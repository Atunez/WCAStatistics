import {
	createTable,
	getCoreRowModel,
	getSortedRowModel,
	type SortingState,
} from "@tanstack/react-table";
import { describe, expect, it } from "vitest";
import type { CompetitionSummary, RegionCoverage } from "#/lib/wca-types";
import {
	buildCompetitionStatusRows,
	type CompetitionStatusRow,
	competitionTableColumns,
	filterCompetitionStatusRows,
} from "./CompetitionTables";

function makeCompetition(
	id: string,
	name: string,
	city: string,
	regionCode: string,
	regionName: string,
	startDate: string,
	endDate = startDate,
): CompetitionSummary {
	return {
		id,
		name,
		city,
		regionCode,
		regionName,
		startDate,
		endDate,
		wcaUrl: `https://www.worldcubeassociation.org/competitions/${id}`,
	};
}

function makeRegionCoverage({
	regionCode,
	regionName,
	recentStartDate,
	recentEndDate = recentStartDate,
	upcomingStartDate,
	upcomingEndDate = upcomingStartDate,
}: {
	regionCode: string;
	regionName: string;
	recentStartDate?: string;
	recentEndDate?: string;
	upcomingStartDate?: string;
	upcomingEndDate?: string;
}): RegionCoverage {
	return {
		regionCode,
		regionName,
		recentCompetitions: recentStartDate
			? [
					makeCompetition(
						`${regionCode}RecentCompetition`,
						`${regionName} Recent Competition`,
						`${regionName} City`,
						regionCode,
						regionName,
						recentStartDate,
						recentEndDate,
					),
				]
			: [],
		upcomingCompetitions: upcomingStartDate
			? [
					makeCompetition(
						`${regionCode}UpcomingCompetition`,
						`${regionName} Upcoming Competition`,
						`${regionName} City`,
						regionCode,
						regionName,
						upcomingStartDate,
						upcomingEndDate,
					),
				]
			: [],
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
				"CA",
				"California",
				"2025-05-03",
			),
			makeCompetition(
				"CaliforniaSpring2024",
				"California Spring 2024",
				"San Jose",
				"CA",
				"California",
				"2024-03-10",
			),
		],
		upcomingCompetitions: [
			makeCompetition(
				"CaliforniaSummer2026",
				"California Summer 2026",
				"San Diego",
				"CA",
				"California",
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
					"NV",
					"Nevada",
					"2026-08-02",
				),
				regionCode: "NV",
				regionName: "Nevada",
			},
		],
	},
];

const sortingVisitedRegions: RegionCoverage[] = [
	makeRegionCoverage({
		regionCode: "AL",
		regionName: "Alpha",
		recentStartDate: "2025-05-01",
		recentEndDate: "2025-05-03",
		upcomingStartDate: "2026-07-10",
	}),
	makeRegionCoverage({
		regionCode: "BE",
		regionName: "Beta",
		recentStartDate: "2025-04-01",
		upcomingStartDate: "2026-05-01",
	}),
];

const sortingUnvisitedRegions: RegionCoverage[] = [
	makeRegionCoverage({
		regionCode: "GA",
		regionName: "Gamma",
		recentStartDate: "2025-05-02",
		recentEndDate: "2025-05-03",
		upcomingStartDate: "2026-07-10",
	}),
	makeRegionCoverage({
		regionCode: "DE",
		regionName: "Delta",
	}),
];

function getSortedRegionNames(
	rows: CompetitionStatusRow[],
	sorting: SortingState,
) {
	const table = createTable<CompetitionStatusRow>({
		data: rows,
		columns: competitionTableColumns,
		state: { sorting },
		onStateChange: () => {},
		renderFallbackValue: null,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	return table.getRowModel().rows.map((row) => row.original.regionName);
}

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

		expect(filterCompetitionStatusRows(rows, "nevada", "all")).toHaveLength(
			1,
		);
		expect(
			filterCompetitionStatusRows(rows, "summer 2026", "all"),
		).toHaveLength(1);
		expect(filterCompetitionStatusRows(rows, "", "visited")).toHaveLength(
			1,
		);
		expect(filterCompetitionStatusRows(rows, "", "remaining")).toHaveLength(
			1,
		);
		expect(
			filterCompetitionStatusRows(rows, "california", "remaining"),
		).toHaveLength(0);
		expect(
			filterCompetitionStatusRows(rows, "missing", "all"),
		).toHaveLength(0);
	});

	it("sorts competition dates chronologically and keeps equal dates stable", () => {
		const rows = buildCompetitionStatusRows(
			sortingVisitedRegions,
			sortingUnvisitedRegions,
		);

		expect(
			getSortedRegionNames(rows, [
				{ id: "latestCompleted", desc: false },
			]),
		).toEqual(["Beta", "Alpha", "Gamma", "Delta"]);

		expect(
			getSortedRegionNames(rows, [{ id: "latestCompleted", desc: true }]),
		).toEqual(["Alpha", "Gamma", "Beta", "Delta"]);

		expect(
			getSortedRegionNames(rows, [
				{ id: "nextOpportunity", desc: false },
			]),
		).toEqual(["Beta", "Alpha", "Gamma", "Delta"]);
	});
});
