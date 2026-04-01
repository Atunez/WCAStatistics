import { describe, expect, it, vi } from "vitest";
import {
	fetchUpcomingCompetitionsSnapshot,
	normalizeUpcomingCompetition,
	summarizeUpcomingCompetitionsByState,
} from "#/server/wca/upcoming-enrichment";

describe("normalizeUpcomingCompetition", () => {
	it("normalizes a U.S. competition into the app read model", () => {
		expect(
			normalizeUpcomingCompetition({
				id: "BayAreaOpen2025",
				name: "Bay Area Open 2025",
				city: "San Jose",
				state: "California",
				countryIso2: "US",
				startDate: "2025-08-10",
				endDate: "2025-08-11",
			}),
		).toEqual({
			competitionId: "BayAreaOpen2025",
			name: "Bay Area Open 2025",
			city: "San Jose",
			stateCode: "CA",
			stateName: "California",
			startDate: "2025-08-10",
			endDate: "2025-08-11",
			wcaUrl:
				"https://www.worldcubeassociation.org/competitions/BayAreaOpen2025",
		});
	});

	it("drops non-U.S. and malformed rows", () => {
		expect(
			normalizeUpcomingCompetition({
				id: "TorontoOpen2025",
				name: "Toronto Open 2025",
				city: "Toronto",
				state: "Ontario",
				countryIso2: "CA",
				startDate: "2025-08-10",
			}),
		).toBeNull();
		expect(
			normalizeUpcomingCompetition({
				id: "BadDate2025",
				name: "Bad Date 2025",
				state: "Texas",
				startDate: "08/10/2025",
			}),
		).toBeNull();
	});
});

describe("summarizeUpcomingCompetitionsByState", () => {
	it("sorts upcoming competitions and limits each state to three rows", () => {
		const competitionsByState = summarizeUpcomingCompetitionsByState(
			[
				{
					id: "HoustonB",
					name: "Houston B",
					city: "Houston",
					state: "TX",
					startDate: "2025-07-03",
					endDate: "2025-07-04",
				},
				{
					id: "HoustonA",
					name: "Houston A",
					city: "Houston",
					state: "Texas",
					startDate: "2025-06-01",
					endDate: "2025-06-01",
				},
				{
					id: "HoustonC",
					name: "Houston C",
					city: "Houston",
					state: "TX",
					startDate: "2025-08-01",
					endDate: "2025-08-01",
				},
				{
					id: "HoustonD",
					name: "Houston D",
					city: "Houston",
					state: "TX",
					startDate: "2025-09-01",
					endDate: "2025-09-01",
				},
				{
					id: "PastCalifornia",
					name: "Past California",
					city: "San Jose",
					state: "CA",
					startDate: "2025-01-01",
					endDate: "2025-01-01",
				},
			],
			{ now: new Date("2025-05-01T00:00:00.000Z") },
		);

		expect(competitionsByState.TX?.map((competition) => competition.competitionId)).toEqual([
			"HoustonA",
			"HoustonB",
			"HoustonC",
		]);
		expect(competitionsByState.CA).toBeUndefined();
	});
});

describe("fetchUpcomingCompetitionsSnapshot", () => {
	it("returns a degraded snapshot on fetch failure instead of throwing", async () => {
		const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new Error("boom"));

		await expect(
			fetchUpcomingCompetitionsSnapshot({
				feedUrl: "https://example.com/upcoming.json",
				fetchFn,
				now: new Date("2025-05-01T00:00:00.000Z"),
			}),
		).resolves.toEqual({
			status: "degraded",
			competitionsByState: {},
			error: "boom",
			fetchedAt: "2025-05-01T00:00:00.000Z",
			sourceItemCount: 0,
		});
	});

	it("accepts either an array payload or a competitions object wrapper", async () => {
		const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
			new Response(
				JSON.stringify({
					competitions: [
						{
							id: "SeattleSummer2025",
							name: "Seattle Summer 2025",
							city: "Seattle",
							state: "WA",
							startDate: "2025-09-10",
							endDate: "2025-09-11",
						},
					],
				}),
				{ status: 200 },
			),
		);

		const snapshot = await fetchUpcomingCompetitionsSnapshot({
			feedUrl: "https://example.com/upcoming.json",
			fetchFn,
			now: new Date("2025-05-01T00:00:00.000Z"),
		});

		expect(snapshot.status).toBe("ok");
		expect(snapshot.sourceItemCount).toBe(1);
		expect(snapshot.competitionsByState.WA?.[0]?.competitionId).toBe(
			"SeattleSummer2025",
		);
	});
});
