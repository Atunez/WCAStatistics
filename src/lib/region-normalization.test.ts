import { describe, expect, it } from "vitest";
import {
	extractCompetitionRegion,
	getRegionByCode,
	normalizeRegion,
} from "./region-normalization";

describe("region normalization", () => {
	it("normalizes direct U.S. territory and province tokens", () => {
		expect(normalizeRegion("us", "Puerto Rico")).toEqual({
			code: "PR",
			name: "Puerto Rico",
		});
		expect(normalizeRegion("us", "Guam")).toEqual({
			code: "GU",
			name: "Guam",
		});
		expect(normalizeRegion("ca", "Yukon")).toEqual({
			code: "YT",
			name: "Yukon",
		});
	});

	it("extracts U.S. and Canadian regions from city or address fields", () => {
		expect(
			extractCompetitionRegion({
				scope: "ca",
				city: "Whitehorse, Yukon",
				venueAddress: "1105 Front ST, Whitehorse, YT Y1A6K6",
			}),
		).toEqual({
			code: "YT",
			name: "Yukon",
		});
		expect(
			extractCompetitionRegion({
				scope: "ca",
				city: "Vancouver",
				venueAddress: "1133 W Hastings St, Vancouver, BC V6E 3T3",
			}),
		).toEqual({
			code: "BC",
			name: "British Columbia",
		});
	});

	it("extracts English ceremonial counties from GB competition locations", () => {
		expect(
			extractCompetitionRegion({
				scope: "eng",
				city: "Manchester, Greater Manchester",
				venueAddress: "422 Stockport Rd, Longsight, Manchester M12 4EX",
			}),
		).toEqual({
			code: "GREATER_MANCHESTER",
			name: "Greater Manchester",
		});
		expect(
			extractCompetitionRegion({
				scope: "eng",
				city: "Wakefield, West Yorkshire",
				venueAddress: "154 Northgate, Wakefield, WF1 3QX",
			}),
		).toEqual({
			code: "WEST_YORKSHIRE",
			name: "West Yorkshire",
		});
		expect(
			extractCompetitionRegion({
				scope: "eng",
				city: "London, Greater London",
				venueAddress: "1 London Wall, London EC2Y 5AU",
			}),
		).toEqual({
			code: "GREATER_LONDON",
			name: "Greater London",
		});
	});

	it("rejects blocked or unmappable locations", () => {
		expect(
			extractCompetitionRegion({
				scope: "eng",
				city: "Glasgow, City of Glasgow",
				venueAddress: "49 Richmond Street, G1 1XU",
			}),
		).toBeNull();
		expect(
			extractCompetitionRegion({
				scope: "us",
				city: "Multiple cities",
				venueAddress: "Multiple Locations",
			}),
		).toBeNull();
		expect(normalizeRegion("us", "Washington, DC")).toBeNull();
	});

	it("looks up regions by canonical code within the selected scope", () => {
		expect(getRegionByCode("us", "pr")).toEqual({
			code: "PR",
			name: "Puerto Rico",
		});
		expect(getRegionByCode("eng", "greater_london")).toEqual({
			code: "GREATER_LONDON",
			name: "Greater London",
		});
	});
});
