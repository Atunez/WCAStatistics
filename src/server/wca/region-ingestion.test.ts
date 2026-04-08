import { describe, expect, it } from "vitest";
import {
	buildSeedRegionRows,
	findCoverageScopeByWcaCountryId,
	mapCompetitionToRegionalInsert,
} from "./region-ingestion";

describe("region ingestion helpers", () => {
	it("maps supported WCA country ids to the expected coverage scope", () => {
		expect(findCoverageScopeByWcaCountryId("USA")).toBe("us");
		expect(findCoverageScopeByWcaCountryId("Canada")).toBe("ca");
		expect(findCoverageScopeByWcaCountryId("United Kingdom")).toBe("eng");
		expect(findCoverageScopeByWcaCountryId("France")).toBeNull();
	});

	it("seeds the configured region catalog into DB-ready rows", () => {
		const rows = buildSeedRegionRows();

		expect(rows.filter((row) => row.country_iso2 === "US")).toHaveLength(
			55,
		);
		expect(rows.filter((row) => row.country_iso2 === "CA")).toHaveLength(
			13,
		);
		expect(rows.filter((row) => row.country_iso2 === "GB")).toHaveLength(
			48,
		);
	});

	it("maps U.S. territory competitions into the generic region table shape", () => {
		expect(
			mapCompetitionToRegionalInsert({
				competitionId: "PuertoRicoOpen2025",
				countryId: "USA",
				name: "Puerto Rico Open 2025",
				cityName: "Trujillo Alto, Puerto Rico",
				venueAddress: "8XVV+CC5, Trujillo Alto, 00976, Puerto Rico",
				startDate: "2025-10-10",
				endDate: "2025-10-11",
				cancelled: false,
			}),
		).toMatchObject({
			status: "mapped",
			scope: "us",
			row: {
				country_iso2: "US",
				region_code: "PR",
			},
		});
	});

	it("maps Canadian competitions into province rows", () => {
		expect(
			mapCompetitionToRegionalInsert({
				competitionId: "BCChampionship2026",
				countryId: "Canada",
				name: "BC Championship 2026",
				cityName: "Vancouver, British Columbia",
				venueAddress: "1133 W Hastings St, Vancouver, BC V6E 3T3",
				startDate: "2026-08-07",
				endDate: "2026-08-09",
				cancelled: false,
			}),
		).toMatchObject({
			status: "mapped",
			scope: "ca",
			row: {
				country_iso2: "CA",
				region_code: "BC",
			},
		});
	});

	it("maps English competitions and rejects non-English GB competitions", () => {
		expect(
			mapCompetitionToRegionalInsert({
				competitionId: "WakefieldSummer2026",
				countryId: "United Kingdom",
				name: "Wakefield Summer 2026",
				cityName: "Wakefield, West Yorkshire",
				venueAddress: "154 Northgate, Wakefield, WF1 3QX",
				startDate: "2026-06-20",
				endDate: "2026-06-20",
				cancelled: false,
			}),
		).toMatchObject({
			status: "mapped",
			scope: "eng",
			row: {
				country_iso2: "GB",
				region_code: "WEST_YORKSHIRE",
			},
		});

		expect(
			mapCompetitionToRegionalInsert({
				competitionId: "EdinburghWinter2026",
				countryId: "United Kingdom",
				name: "Edinburgh Winter 2026",
				cityName: "Edinburgh, City of Edinburgh",
				venueAddress: "London Road, Edinburgh, EH7 6AE",
				startDate: "2026-01-11",
				endDate: "2026-01-11",
				cancelled: false,
			}),
		).toEqual({
			status: "skipped",
			scope: "eng",
			reason: "unmapped-region",
		});
	});

	it("skips multi-location competitions as unmappable", () => {
		expect(
			mapCompetitionToRegionalInsert({
				competitionId: "FMCCanada2025",
				countryId: "Canada",
				name: "FMC Canada 2025",
				cityName: "Multiple cities",
				venueAddress: "Multiple Locations",
				startDate: "2025-11-01",
				endDate: "2025-11-01",
				cancelled: false,
			}),
		).toEqual({
			status: "skipped",
			scope: "ca",
			reason: "unmapped-region",
		});
	});
});
