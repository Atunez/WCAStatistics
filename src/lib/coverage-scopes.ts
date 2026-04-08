import {
	CANADA_PROVINCES_AND_TERRITORIES,
	ENGLAND_CEREMONIAL_COUNTIES,
	type Region,
	US_REGIONS,
} from "./region-catalog";

export type CoverageScope = "us" | "ca" | "eng";

export interface CoverageScopeConfig {
	scope: CoverageScope;
	label: string;
	shortLabel: string;
	regionLabelPlural: string;
	sourceCountryIso2: "US" | "CA" | "GB";
	wcaExportCountryId: "USA" | "Canada" | "United Kingdom";
	dbCountryIso2: "US" | "CA" | "GB";
	regions: readonly Region[];
}

export const DEFAULT_SCOPE: CoverageScope = "us";

export const COVERAGE_SCOPE_CONFIGS: Record<
	CoverageScope,
	CoverageScopeConfig
> = {
	us: {
		scope: "us",
		label: "United States",
		shortLabel: "U.S.",
		regionLabelPlural: "U.S. regions",
		sourceCountryIso2: "US",
		wcaExportCountryId: "USA",
		dbCountryIso2: "US",
		regions: US_REGIONS,
	},
	ca: {
		scope: "ca",
		label: "Canada",
		shortLabel: "Canada",
		regionLabelPlural: "Canadian regions",
		sourceCountryIso2: "CA",
		wcaExportCountryId: "Canada",
		dbCountryIso2: "CA",
		regions: CANADA_PROVINCES_AND_TERRITORIES,
	},
	eng: {
		scope: "eng",
		label: "England",
		shortLabel: "England",
		regionLabelPlural: "English regions",
		sourceCountryIso2: "GB",
		wcaExportCountryId: "United Kingdom",
		dbCountryIso2: "GB",
		regions: ENGLAND_CEREMONIAL_COUNTIES,
	},
};

export const COVERAGE_SCOPE_OPTIONS = (
	Object.values(COVERAGE_SCOPE_CONFIGS) as CoverageScopeConfig[]
).map((scope) => ({
	value: scope.scope,
	label: scope.label,
}));

export function parseCoverageScope(
	value: string | null | undefined,
): CoverageScope {
	if (!value) {
		return DEFAULT_SCOPE;
	}

	const normalized = value.trim().toLowerCase();
	if (normalized === "us" || normalized === "ca" || normalized === "eng") {
		return normalized;
	}

	return DEFAULT_SCOPE;
}

export function getCoverageScopeConfig(
	scope: CoverageScope | string | null | undefined,
): CoverageScopeConfig {
	return COVERAGE_SCOPE_CONFIGS[parseCoverageScope(scope)];
}

export function getRegionsForScope(
	scope: CoverageScope | string | null | undefined,
): readonly Region[] {
	return getCoverageScopeConfig(scope).regions;
}
