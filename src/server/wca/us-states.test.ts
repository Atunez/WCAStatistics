import { describe, expect, it } from "vitest";
import {
	buildStateCoveragePartitions,
	getUsStateByCode,
	normalizeUsState,
	US_STATES,
} from "#/server/wca/us-states";

describe("normalizeUsState", () => {
	it("normalizes postal codes and full names", () => {
		expect(normalizeUsState("ca")).toEqual({
			code: "CA",
			name: "California",
		});
		expect(normalizeUsState("New York")).toEqual({
			code: "NY",
			name: "New York",
		});
	});

	it("finds state aliases inside location strings", () => {
		expect(normalizeUsState("Austin, TX")).toEqual({
			code: "TX",
			name: "Texas",
		});
		expect(normalizeUsState("Seattle / WA")).toEqual({
			code: "WA",
			name: "Washington",
		});
	});

	it("ignores non-state locations", () => {
		expect(normalizeUsState("Washington, DC")).toBeNull();
		expect(normalizeUsState("Puerto Rico")).toBeNull();
	});
});

describe("buildStateCoveragePartitions", () => {
	it("partitions all 50 states into visited and unvisited buckets", () => {
		const partitions = buildStateCoveragePartitions({
			visitedStateCodes: ["CA", "NY", "invalid"],
			recentCompetitionsByState: {
				CA: [
					{
						competitionId: "NorCalOpen2025",
						name: "NorCal Open 2025",
						city: "San Jose",
						startDate: "2025-03-20",
						endDate: "2025-03-21",
						wcaUrl:
							"https://www.worldcubeassociation.org/competitions/NorCalOpen2025",
					},
				],
			},
			upcomingCompetitionsByState: {
				TX: [
					{
						competitionId: "HoustonSummer2025",
						name: "Houston Summer 2025",
						city: "Houston",
						startDate: "2025-06-02",
						endDate: "2025-06-02",
						wcaUrl:
							"https://www.worldcubeassociation.org/competitions/HoustonSummer2025",
					},
				],
			},
		});

		expect(partitions.totalStates).toBe(US_STATES.length);
		expect(partitions.visitedCount).toBe(2);
		expect(partitions.visited.map((entry) => entry.state.code)).toEqual(["CA", "NY"]);
		expect(partitions.unvisited).toHaveLength(US_STATES.length - 2);
		expect(
			partitions.visited.find((entry) => entry.state.code === "CA")
				?.recentCompetitions[0]?.competitionId,
		).toBe("NorCalOpen2025");
		expect(
			partitions.unvisited.find((entry) => entry.state.code === "TX")
				?.upcomingCompetitions[0]?.competitionId,
		).toBe("HoustonSummer2025");
	});

	it("looks up state records by canonical code", () => {
		expect(getUsStateByCode("wa")).toEqual({
			code: "WA",
			name: "Washington",
		});
		expect(getUsStateByCode("dc")).toBeNull();
	});
});
