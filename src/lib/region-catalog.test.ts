import { describe, expect, it } from "vitest";
import {
	CANADA_PROVINCES_AND_TERRITORIES,
	createRegionLookup,
	ENGLAND_CEREMONIAL_COUNTIES,
	normalizeRegionLookupToken,
	US_REGIONS,
	US_TERRITORIES,
} from "./region-catalog";

describe("region catalog", () => {
	it("includes all supported U.S. states and territories", () => {
		expect(US_TERRITORIES.map((region) => region.code)).toEqual([
			"AS",
			"GU",
			"MP",
			"PR",
			"VI",
		]);
		expect(US_REGIONS).toHaveLength(55);
	});

	it("includes all 13 Canadian provinces and territories", () => {
		expect(CANADA_PROVINCES_AND_TERRITORIES).toHaveLength(13);
		expect(CANADA_PROVINCES_AND_TERRITORIES.at(-1)).toEqual({
			code: "YT",
			name: "Yukon",
		});
	});

	it("includes the 48 ceremonial counties of England", () => {
		expect(ENGLAND_CEREMONIAL_COUNTIES).toHaveLength(48);
		expect(
			ENGLAND_CEREMONIAL_COUNTIES.some(
				(region) => region.name === "Greater London",
			),
		).toBe(true);
		expect(
			ENGLAND_CEREMONIAL_COUNTIES.some(
				(region) => region.name === "City of London",
			),
		).toBe(true);
	});

	it("normalizes common aliases into the canonical region entry", () => {
		const canadaLookup = createRegionLookup(
			CANADA_PROVINCES_AND_TERRITORIES,
		);
		const englandLookup = createRegionLookup(ENGLAND_CEREMONIAL_COUNTIES);

		expect(
			canadaLookup.byToken.get(normalizeRegionLookupToken("PEI"))?.name,
		).toBe("Prince Edward Island");
		expect(
			englandLookup.byToken.get(normalizeRegionLookupToken("Tyne & Wear"))
				?.name,
		).toBe("Tyne and Wear");
	});
});
