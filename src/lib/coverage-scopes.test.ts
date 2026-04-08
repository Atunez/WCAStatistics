import { describe, expect, it } from "vitest";
import {
	DEFAULT_SCOPE,
	getCoverageScopeConfig,
	parseCoverageScope,
} from "./coverage-scopes";

describe("coverage scopes", () => {
	it("defaults invalid and missing scope values to the default scope", () => {
		expect(parseCoverageScope(undefined)).toBe(DEFAULT_SCOPE);
		expect(parseCoverageScope(null)).toBe(DEFAULT_SCOPE);
		expect(parseCoverageScope("invalid")).toBe(DEFAULT_SCOPE);
	});

	it("accepts the supported scope values", () => {
		expect(parseCoverageScope("us")).toBe("us");
		expect(parseCoverageScope("ca")).toBe("ca");
		expect(parseCoverageScope("eng")).toBe("eng");
	});

	it("returns the expected configured region totals", () => {
		expect(getCoverageScopeConfig("us").regions).toHaveLength(55);
		expect(getCoverageScopeConfig("ca").regions).toHaveLength(13);
		expect(getCoverageScopeConfig("eng").regions).toHaveLength(48);
	});
});
