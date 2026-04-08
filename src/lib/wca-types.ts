import type { CoverageScope } from "./coverage-scopes";

export type WcaCompetition = {
	id: string;
	name: string;
	city: string;
	country: string;
	date: {
		from: string;
		till: string;
		numberOfDays: number;
	};
	isCanceled: boolean;
	venue?: {
		address?: string;
	};
};

export type WcaPerson = {
	id: string;
	name: string;
	country: string;
	numberOfCompetitions: number;
	competitionIds: string[];
};

export type CompetitionSummary = {
	id: string;
	name: string;
	city: string;
	regionCode: string;
	regionName: string;
	startDate: string;
	endDate: string;
	wcaUrl: string;
};

export type RegionCoverage = {
	regionCode: string;
	regionName: string;
	recentCompetitions: CompetitionSummary[];
	upcomingCompetitions: CompetitionSummary[];
};

export type CompetitorCoverageView = {
	scope: CoverageScope;
	scopeLabel: string;
	competitor: {
		wcaId: string;
		name: string;
		countryCode: string;
		totalCompetitions: number;
	};
	visitedRegionsCount: number;
	totalRegions: number;
	visitedRegions: RegionCoverage[];
	unvisitedRegions: RegionCoverage[];
	sourceUpdatedAt: string;
};

export type LeaderboardEntry = {
	rank: number;
	wcaId: string;
	name: string;
	countryCode: string;
	visitedRegionsCount: number;
	totalCompetitions: number;
};

export type IngestionRunStatus = "started" | "succeeded" | "failed" | "skipped";

export type IngestionRunRecord = {
	id: number;
	exportDate: string;
	exportFormatVersion: string;
	tsvUrl: string;
	status: IngestionRunStatus;
	startedAt: string;
	finishedAt: string | null;
	error: string | null;
	peopleCount: number;
	competitionsCount: number;
	personCompetitionPairsCount: number;
	statesMappedCount: number;
	skippedReason: string | null;
};

export type WcaPersonRow = {
	wcaId: string;
	name: string;
	countryId: string;
};

export type RegionalCompetitionRow = {
	competitionId: string;
	countryIso2: string;
	name: string;
	cityName: string;
	venueAddress: string | null;
	regionCode: string;
	startDate: string;
	endDate: string;
	cancelled: boolean;
};

export type PersonRegionalCompetitionRow = {
	wcaId: string;
	competitionId: string;
};

export type PersonCountryRegionSummaryRow = {
	wcaId: string;
	countryIso2: string;
	visitedRegionsCount: number;
	countryCompetitionsCount: number;
	updatedAt: string;
};
