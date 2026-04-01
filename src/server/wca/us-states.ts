export interface UsState {
	code: UsStateCode;
	name: string;
}

export const US_STATES = [
	{ code: "AL", name: "Alabama" },
	{ code: "AK", name: "Alaska" },
	{ code: "AZ", name: "Arizona" },
	{ code: "AR", name: "Arkansas" },
	{ code: "CA", name: "California" },
	{ code: "CO", name: "Colorado" },
	{ code: "CT", name: "Connecticut" },
	{ code: "DE", name: "Delaware" },
	{ code: "FL", name: "Florida" },
	{ code: "GA", name: "Georgia" },
	{ code: "HI", name: "Hawaii" },
	{ code: "ID", name: "Idaho" },
	{ code: "IL", name: "Illinois" },
	{ code: "IN", name: "Indiana" },
	{ code: "IA", name: "Iowa" },
	{ code: "KS", name: "Kansas" },
	{ code: "KY", name: "Kentucky" },
	{ code: "LA", name: "Louisiana" },
	{ code: "ME", name: "Maine" },
	{ code: "MD", name: "Maryland" },
	{ code: "MA", name: "Massachusetts" },
	{ code: "MI", name: "Michigan" },
	{ code: "MN", name: "Minnesota" },
	{ code: "MS", name: "Mississippi" },
	{ code: "MO", name: "Missouri" },
	{ code: "MT", name: "Montana" },
	{ code: "NE", name: "Nebraska" },
	{ code: "NV", name: "Nevada" },
	{ code: "NH", name: "New Hampshire" },
	{ code: "NJ", name: "New Jersey" },
	{ code: "NM", name: "New Mexico" },
	{ code: "NY", name: "New York" },
	{ code: "NC", name: "North Carolina" },
	{ code: "ND", name: "North Dakota" },
	{ code: "OH", name: "Ohio" },
	{ code: "OK", name: "Oklahoma" },
	{ code: "OR", name: "Oregon" },
	{ code: "PA", name: "Pennsylvania" },
	{ code: "RI", name: "Rhode Island" },
	{ code: "SC", name: "South Carolina" },
	{ code: "SD", name: "South Dakota" },
	{ code: "TN", name: "Tennessee" },
	{ code: "TX", name: "Texas" },
	{ code: "UT", name: "Utah" },
	{ code: "VT", name: "Vermont" },
	{ code: "VA", name: "Virginia" },
	{ code: "WA", name: "Washington" },
	{ code: "WV", name: "West Virginia" },
	{ code: "WI", name: "Wisconsin" },
	{ code: "WY", name: "Wyoming" },
] as const satisfies readonly UsState[];

export type UsStateCode = (typeof US_STATES)[number]["code"];

export interface CompetitionListing {
	competitionId: string;
	name: string;
	city: string | null;
	startDate: string;
	endDate: string | null;
	wcaUrl: string;
}

export interface StateCoverageView {
	state: UsState;
	recentCompetitions: CompetitionListing[];
	upcomingCompetitions: CompetitionListing[];
}

export interface StateCoveragePartitions {
	visited: StateCoverageView[];
	unvisited: StateCoverageView[];
	visitedCount: number;
	totalStates: number;
}

export const US_STATE_CODES = US_STATES.map((state) => state.code);

const US_STATE_BY_CODE = new Map<UsStateCode, UsState>(
	US_STATES.map((state) => [state.code, state]),
);

const US_STATE_ALIAS_TO_CODE = new Map<string, UsStateCode>(
	US_STATES.flatMap((state) => [
		[normalizeStateToken(state.code), state.code] as const,
		[normalizeStateToken(state.name), state.code] as const,
	]),
);

function normalizeStateToken(value: string): string {
	return value.trim().toLowerCase().replaceAll(".", "").replaceAll(/\s+/g, " ");
}

export function getUsStateByCode(code: string | null | undefined): UsState | null {
	if (!code) {
		return null;
	}

	return US_STATE_BY_CODE.get(code.toUpperCase() as UsStateCode) ?? null;
}

export function normalizeUsState(
	value: string | null | undefined,
): UsState | null {
	if (!value) {
		return null;
	}

	const raw = normalizeStateToken(value);
	const directMatch = US_STATE_ALIAS_TO_CODE.get(raw);
	if (directMatch) {
		return getUsStateByCode(directMatch);
	}

	for (const segment of raw.split(",")) {
		const match = US_STATE_ALIAS_TO_CODE.get(segment.trim());
		if (match) {
			return getUsStateByCode(match);
		}
	}

	for (const segment of raw.split("/")) {
		const match = US_STATE_ALIAS_TO_CODE.get(segment.trim());
		if (match) {
			return getUsStateByCode(match);
		}
	}

	return null;
}

function sortCompetitions(
	competitions: readonly CompetitionListing[] | undefined,
	direction: "asc" | "desc",
): CompetitionListing[] {
	if (!competitions?.length) {
		return [];
	}

	return [...competitions].sort((left, right) => {
		const dateCompare =
			direction === "asc"
				? left.startDate.localeCompare(right.startDate)
				: right.startDate.localeCompare(left.startDate);

		if (dateCompare !== 0) {
			return dateCompare;
		}

		return left.competitionId.localeCompare(right.competitionId);
	});
}

export function buildStateCoveragePartitions(input: {
	visitedStateCodes: Iterable<string>;
	recentCompetitionsByState?: Partial<Record<UsStateCode, readonly CompetitionListing[]>>;
	upcomingCompetitionsByState?: Partial<
		Record<UsStateCode, readonly CompetitionListing[]>
	>;
}): StateCoveragePartitions {
	const visitedStateCodes = new Set<UsStateCode>();

	for (const stateCode of input.visitedStateCodes) {
		const normalized = getUsStateByCode(stateCode);
		if (normalized) {
			visitedStateCodes.add(normalized.code);
		}
	}

	const visited: StateCoverageView[] = [];
	const unvisited: StateCoverageView[] = [];

	for (const state of US_STATES) {
		const stateView = {
			state,
			recentCompetitions: sortCompetitions(
				input.recentCompetitionsByState?.[state.code],
				"desc",
			).slice(0, 3),
			upcomingCompetitions: sortCompetitions(
				input.upcomingCompetitionsByState?.[state.code],
				"asc",
			).slice(0, 3),
		} satisfies StateCoverageView;

		if (visitedStateCodes.has(state.code)) {
			visited.push(stateView);
			continue;
		}

		unvisited.push(stateView);
	}

	return {
		visited,
		unvisited,
		visitedCount: visited.length,
		totalStates: US_STATES.length,
	};
}
