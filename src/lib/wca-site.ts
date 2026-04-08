import { and, asc, desc, eq, gt } from "drizzle-orm";
import { getDb } from "#/server/db";
import {
	personCountryRegionSummary,
	personRegionalCompetitions,
	regionalCompetitions,
	wcaExportRuns,
	wcaPeople,
} from "#/server/db/schema";
import {
	type CoverageScope,
	getCoverageScopeConfig,
	getRegionsForScope,
} from "./coverage-scopes";
import { parseLeaderboardLimit } from "./leaderboard-limit";
import type {
	CompetitionSummary,
	LeaderboardEntry,
	RegionCoverage,
} from "./wca-types";

const WCA_COMPETITION_URL = "https://www.worldcubeassociation.org/competitions";
const DATABASE_QUERY_TIMEOUT_MS = 8_000;

type CompetitionCatalog = Map<
	string,
	{
		recentCompetitions: CompetitionSummary[];
		upcomingCompetitions: CompetitionSummary[];
	}
>;

export type UpcomingCompetitionSnapshot = {
	status: "ok" | "degraded";
	competitionsByRegion: Partial<Record<string, CompetitionSummary[]>>;
	fetchedAt: string;
	sourceItemCount: number;
	error?: string;
};

export type CompetitorPageData = {
	scope: CoverageScope;
	scopeLabel: string;
	regionLabelPlural: string;
	competitor: {
		wcaId: string;
		name: string;
		countryCode: string;
		totalCompetitions: number;
	} | null;
	visitedRegionsCount: number;
	totalRegions: number;
	visitedRegions: RegionCoverage[];
	unvisitedRegions: RegionCoverage[];
	historicalSourceUpdatedAt: string | null;
	upcomingSourceUpdatedAt: string | null;
	upcomingStatus: UpcomingCompetitionSnapshot["status"];
	upcomingError?: string;
};

function compareAsc(a: CompetitionSummary, b: CompetitionSummary) {
	return a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id);
}

function compareDesc(a: CompetitionSummary, b: CompetitionSummary) {
	return compareAsc(b, a);
}

async function withTimeout<T>(
	promise: Promise<T>,
	label: string,
	timeoutMs = DATABASE_QUERY_TIMEOUT_MS,
): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			reject(new Error(`Timed out while waiting for ${label}.`));
		}, timeoutMs);
	});

	try {
		return await Promise.race([promise, timeout]);
	} finally {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	}
}

function toIsoTimestamp(
	value: Date | string | null | undefined,
): string | null {
	if (!value) {
		return null;
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	const normalized = new Date(value);
	if (Number.isNaN(normalized.getTime())) {
		return null;
	}

	return normalized.toISOString();
}

function normalizeWcaId(value: string) {
	return value.trim().toUpperCase();
}

function normalizeDate(value: Date | string): string {
	if (value instanceof Date) {
		return value.toISOString().slice(0, 10);
	}

	return value;
}

function mapCompetitionRow(
	row: {
		competitionId: string;
		name: string;
		cityName: string;
		regionCode: string;
		startDate: Date | string;
		endDate: Date | string;
	},
	regionsByCode: ReadonlyMap<string, { code: string; name: string }>,
) {
	const region = regionsByCode.get(row.regionCode);

	return {
		id: row.competitionId,
		name: row.name,
		city: row.cityName,
		regionCode: row.regionCode,
		regionName: region?.name ?? row.regionCode,
		startDate: normalizeDate(row.startDate),
		endDate: normalizeDate(row.endDate),
		wcaUrl: `${WCA_COMPETITION_URL}/${row.competitionId}`,
	} satisfies CompetitionSummary;
}

function buildRegionCatalog(input: {
	rows: Array<{
		competitionId: string;
		name: string;
		cityName: string;
		regionCode: string;
		startDate: Date | string;
		endDate: Date | string;
	}>;
	regions: readonly { code: string; name: string }[];
	todayIso?: string;
}) {
	const todayIso = input.todayIso ?? new Date().toISOString().slice(0, 10);
	const regionsByCode = new Map(
		input.regions.map((region) => [region.code, region]),
	);
	const catalog: CompetitionCatalog = new Map(
		input.regions.map((region) => [
			region.code,
			{
				recentCompetitions: [] as CompetitionSummary[],
				upcomingCompetitions: [] as CompetitionSummary[],
			},
		]),
	);

	const byCompetitionId = new Map<string, CompetitionSummary>();
	for (const row of input.rows) {
		const summary = mapCompetitionRow(row, regionsByCode);
		byCompetitionId.set(summary.id, summary);

		const bucket = catalog.get(summary.regionCode);
		if (!bucket) {
			continue;
		}

		if (summary.startDate >= todayIso) {
			bucket.upcomingCompetitions.push(summary);
			continue;
		}

		bucket.recentCompetitions.push(summary);
	}

	for (const bucket of catalog.values()) {
		bucket.recentCompetitions.sort(compareDesc);
		bucket.upcomingCompetitions.sort(compareAsc);
	}

	return {
		catalog,
		byCompetitionId,
		regionsByCode,
	};
}

function makeRegionCoverage(
	regionCode: string,
	regionsByCode: ReadonlyMap<string, { code: string; name: string }>,
	catalog: CompetitionCatalog,
): RegionCoverage {
	const region = regionsByCode.get(regionCode);
	const bucket = catalog.get(regionCode);

	return {
		regionCode,
		regionName: region?.name ?? regionCode,
		recentCompetitions: bucket?.recentCompetitions.slice(0, 3) ?? [],
		upcomingCompetitions: bucket?.upcomingCompetitions.slice(0, 3) ?? [],
	};
}

async function getLatestSuccessfulRun() {
	const db = getDb();
	const rows = await withTimeout(
		db
			.select({
				exportDate: wcaExportRuns.exportDate,
				finishedAt: wcaExportRuns.finishedAt,
			})
			.from(wcaExportRuns)
			.where(eq(wcaExportRuns.status, "succeeded"))
			.orderBy(desc(wcaExportRuns.exportDate))
			.limit(1),
		"latest successful ingestion run query",
	);

	return rows[0] ?? null;
}

export async function getLeaderboardEntries(input?: {
	n?: number | string | null;
	scope?: CoverageScope | string | null;
}): Promise<LeaderboardEntry[]> {
	try {
		const db = getDb();
		const limit = parseLeaderboardLimit(input?.n);
		const scopeConfig = getCoverageScopeConfig(input?.scope);

		const rows = await withTimeout(
			db
				.select({
					wcaId: personCountryRegionSummary.wcaId,
					name: wcaPeople.name,
					countryCode: wcaPeople.countryId,
					visitedRegionsCount:
						personCountryRegionSummary.visitedRegionsCount,
					totalCompetitions:
						personCountryRegionSummary.countryCompetitionsCount,
				})
				.from(personCountryRegionSummary)
				.innerJoin(
					wcaPeople,
					eq(wcaPeople.wcaId, personCountryRegionSummary.wcaId),
				)
				.where(
					and(
						eq(
							personCountryRegionSummary.countryIso2,
							scopeConfig.dbCountryIso2,
						),
						gt(personCountryRegionSummary.visitedRegionsCount, 0),
					),
				)
				.orderBy(
					desc(personCountryRegionSummary.visitedRegionsCount),
					asc(personCountryRegionSummary.wcaId),
				)
				.limit(limit),
			"leaderboard query",
		);

		return rows.map((entry, index) => ({
			rank: index + 1,
			...entry,
		}));
	} catch (error) {
		console.error("Failed to fetch leaderboard entries:", error);
		return [];
	}
}

export async function getLeaderboardGeneratedAt() {
	try {
		const latestRun = await getLatestSuccessfulRun();
		return (
			toIsoTimestamp(latestRun?.exportDate) ??
			toIsoTimestamp(latestRun?.finishedAt)
		);
	} catch (error) {
		console.error(
			"Failed to fetch leaderboard generated timestamp:",
			error,
		);
		return null;
	}
}

export async function getCompetitorPageData(
	wcaId: string,
	scope: CoverageScope = "us",
): Promise<CompetitorPageData> {
	const normalizedWcaId = normalizeWcaId(wcaId);
	const scopeConfig = getCoverageScopeConfig(scope);
	const regions = getRegionsForScope(scope);

	try {
		const db = getDb();
		const [personRows, competitionRows, participantRows, latestRun] =
			await Promise.all([
				withTimeout(
					db
						.select({
							wcaId: wcaPeople.wcaId,
							name: wcaPeople.name,
							countryCode: wcaPeople.countryId,
						})
						.from(wcaPeople)
						.where(eq(wcaPeople.wcaId, normalizedWcaId))
						.limit(1),
					"competitor lookup query",
				),
				withTimeout(
					db
						.select({
							competitionId: regionalCompetitions.competitionId,
							name: regionalCompetitions.name,
							cityName: regionalCompetitions.cityName,
							regionCode: regionalCompetitions.regionCode,
							startDate: regionalCompetitions.startDate,
							endDate: regionalCompetitions.endDate,
						})
						.from(regionalCompetitions)
						.where(
							and(
								eq(
									regionalCompetitions.countryIso2,
									scopeConfig.dbCountryIso2,
								),
								eq(regionalCompetitions.cancelled, false),
							),
						),
					"competition catalog query",
				),
				withTimeout(
					db
						.select({
							competitionId:
								personRegionalCompetitions.competitionId,
						})
						.from(personRegionalCompetitions)
						.innerJoin(
							regionalCompetitions,
							eq(
								regionalCompetitions.competitionId,
								personRegionalCompetitions.competitionId,
							),
						)
						.where(
							and(
								eq(
									personRegionalCompetitions.wcaId,
									normalizedWcaId,
								),
								eq(
									regionalCompetitions.countryIso2,
									scopeConfig.dbCountryIso2,
								),
								eq(regionalCompetitions.cancelled, false),
							),
						),
					"competitor participation query",
				),
				getLatestSuccessfulRun(),
			]);

		const person = personRows[0] ?? null;
		const historicalSourceUpdatedAt =
			toIsoTimestamp(latestRun?.exportDate) ??
			toIsoTimestamp(latestRun?.finishedAt);
		const { catalog, byCompetitionId, regionsByCode } = buildRegionCatalog({
			rows: competitionRows,
			regions,
		});

		if (!person) {
			return {
				scope: scopeConfig.scope,
				scopeLabel: scopeConfig.label,
				regionLabelPlural: scopeConfig.regionLabelPlural,
				competitor: null,
				visitedRegionsCount: 0,
				totalRegions: regions.length,
				visitedRegions: [],
				unvisitedRegions: regions.map((region) =>
					makeRegionCoverage(region.code, regionsByCode, catalog),
				),
				historicalSourceUpdatedAt,
				upcomingSourceUpdatedAt: historicalSourceUpdatedAt,
				upcomingStatus: latestRun ? "ok" : "degraded",
				upcomingError: latestRun
					? undefined
					: "No successful weekly export ingestion has completed yet.",
			};
		}

		const visitedRegions = new Set<string>();
		for (const row of participantRows) {
			const competition = byCompetitionId.get(row.competitionId);
			if (competition) {
				visitedRegions.add(competition.regionCode);
			}
		}

		const visitedRegionCodes = [...visitedRegions].sort((a, b) =>
			a.localeCompare(b),
		);
		const unvisitedRegionCodes = regions
			.map((region) => region.code)
			.filter((regionCode) => !visitedRegions.has(regionCode));

		return {
			scope: scopeConfig.scope,
			scopeLabel: scopeConfig.label,
			regionLabelPlural: scopeConfig.regionLabelPlural,
			competitor: {
				wcaId: person.wcaId,
				name: person.name,
				countryCode: person.countryCode,
				totalCompetitions: participantRows.length,
			},
			visitedRegionsCount: visitedRegionCodes.length,
			totalRegions: regions.length,
			visitedRegions: visitedRegionCodes.map((regionCode) =>
				makeRegionCoverage(regionCode, regionsByCode, catalog),
			),
			unvisitedRegions: unvisitedRegionCodes.map((regionCode) =>
				makeRegionCoverage(regionCode, regionsByCode, catalog),
			),
			historicalSourceUpdatedAt,
			upcomingSourceUpdatedAt: historicalSourceUpdatedAt,
			upcomingStatus: latestRun ? "ok" : "degraded",
			upcomingError: latestRun
				? undefined
				: "No successful weekly export ingestion has completed yet.",
		};
	} catch (error) {
		console.error("Failed to fetch competitor page data:", error);
		const { catalog, regionsByCode } = buildRegionCatalog({
			rows: [],
			regions,
		});

		return {
			scope: scopeConfig.scope,
			scopeLabel: scopeConfig.label,
			regionLabelPlural: scopeConfig.regionLabelPlural,
			competitor: null,
			visitedRegionsCount: 0,
			totalRegions: regions.length,
			visitedRegions: [],
			unvisitedRegions: regions.map((region) =>
				makeRegionCoverage(region.code, regionsByCode, catalog),
			),
			historicalSourceUpdatedAt: null,
			upcomingSourceUpdatedAt: null,
			upcomingStatus: "degraded",
			upcomingError:
				"Database query timed out or failed in this runtime. Historical coverage is temporarily unavailable.",
		};
	}
}
