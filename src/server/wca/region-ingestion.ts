import {
	COVERAGE_SCOPE_CONFIGS,
	type CoverageScope,
	getCoverageScopeConfig,
} from "#/lib/coverage-scopes";
import { extractCompetitionRegion } from "#/lib/region-normalization";

export type WcaRegionSeedRow = {
	country_iso2: string;
	region_code: string;
	region_name: string;
	region_level: "subnational";
	is_selectable: boolean;
};

export type RegionalCompetitionInsertRow = {
	competition_id: string;
	country_iso2: string;
	region_code: string;
	name: string;
	city_name: string;
	venue_address: string | null;
	start_date: string;
	end_date: string;
	cancelled: boolean;
};

export type CompetitionRegionMappingInput = {
	competitionId: string;
	countryId: string;
	name: string;
	cityName: string;
	venueAddress: string | null;
	startDate: string | null;
	endDate: string | null;
	cancelled: boolean;
};

export type CompetitionRegionMappingResult =
	| {
			status: "ignored";
	  }
	| {
			status: "skipped";
			scope: CoverageScope;
			reason: "unmapped-region" | "invalid-date";
	  }
	| {
			status: "mapped";
			scope: CoverageScope;
			row: RegionalCompetitionInsertRow;
	  };

export function findCoverageScopeByWcaCountryId(
	countryId: string | null | undefined,
): CoverageScope | null {
	if (!countryId) {
		return null;
	}

	const normalized = countryId.trim();
	for (const scope of Object.keys(
		COVERAGE_SCOPE_CONFIGS,
	) as CoverageScope[]) {
		if (COVERAGE_SCOPE_CONFIGS[scope].wcaExportCountryId === normalized) {
			return scope;
		}
	}

	return null;
}

export function buildSeedRegionRows(): WcaRegionSeedRow[] {
	return (Object.keys(COVERAGE_SCOPE_CONFIGS) as CoverageScope[]).flatMap(
		(scope) => {
			const scopeConfig = getCoverageScopeConfig(scope);
			return scopeConfig.regions.map((region) => ({
				country_iso2: scopeConfig.dbCountryIso2,
				region_code: region.code,
				region_name: region.name,
				region_level: "subnational" as const,
				is_selectable: true,
			}));
		},
	);
}

export function mapCompetitionToRegionalInsert(
	input: CompetitionRegionMappingInput,
): CompetitionRegionMappingResult {
	const scope = findCoverageScopeByWcaCountryId(input.countryId);
	if (!input.competitionId || input.cancelled || !scope) {
		return {
			status: "ignored",
		};
	}

	if (!input.startDate || !input.endDate) {
		return {
			status: "skipped",
			scope,
			reason: "invalid-date",
		};
	}

	const scopeConfig = getCoverageScopeConfig(scope);
	const region = extractCompetitionRegion({
		scope,
		city: input.cityName,
		venueAddress: input.venueAddress,
	});

	if (!region) {
		return {
			status: "skipped",
			scope,
			reason: "unmapped-region",
		};
	}

	return {
		status: "mapped",
		scope,
		row: {
			competition_id: input.competitionId,
			country_iso2: scopeConfig.dbCountryIso2,
			region_code: region.code,
			name: input.name,
			city_name: input.cityName,
			venue_address: input.venueAddress,
			start_date: input.startDate,
			end_date: input.endDate,
			cancelled: false,
		},
	};
}
