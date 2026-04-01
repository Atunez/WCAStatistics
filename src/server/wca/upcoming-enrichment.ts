import {
	type CompetitionListing,
	type UsStateCode,
	normalizeUsState,
} from "#/server/wca/us-states";

export interface UpcomingCompetitionFeedItem {
	id?: string | null;
	competitionId?: string | null;
	name?: string | null;
	city?: string | null;
	state?: string | null;
	country?: string | null;
	countryIso2?: string | null;
	startDate?: string | null;
	start_date?: string | null;
	endDate?: string | null;
	end_date?: string | null;
	url?: string | null;
	wcaUrl?: string | null;
}

export interface UpcomingCompetition extends CompetitionListing {
	stateCode: UsStateCode;
	stateName: string;
}

export interface UpcomingEnrichmentSnapshot {
	status: "ok" | "degraded";
	competitionsByState: Partial<Record<UsStateCode, UpcomingCompetition[]>>;
	fetchedAt: string;
	sourceItemCount: number;
	error?: string;
}

function pickFirstString(
	item: UpcomingCompetitionFeedItem,
	keys: Array<keyof UpcomingCompetitionFeedItem>,
): string | null {
	for (const key of keys) {
		const candidate = item[key];
		if (typeof candidate === "string" && candidate.trim().length > 0) {
			return candidate.trim();
		}
	}

	return null;
}

function isUsCountry(item: UpcomingCompetitionFeedItem): boolean {
	const country = pickFirstString(item, ["countryIso2", "country"]);
	if (!country) {
		return true;
	}

	const normalized = country.trim().toUpperCase();
	return normalized === "US" || normalized === "USA" || normalized === "UNITED STATES";
}

function isIsoDate(value: string | null): value is string {
	return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeUpcomingCompetition(
	item: UpcomingCompetitionFeedItem,
): UpcomingCompetition | null {
	if (!isUsCountry(item)) {
		return null;
	}

	const competitionId = pickFirstString(item, ["competitionId", "id"]);
	const name = pickFirstString(item, ["name"]);
	const state = normalizeUsState(pickFirstString(item, ["state", "city"]));
	const city = pickFirstString(item, ["city"]);
	const startDate = pickFirstString(item, ["startDate", "start_date"]);
	const endDate =
		pickFirstString(item, ["endDate", "end_date"]) ?? startDate ?? null;

	if (!competitionId || !name || !state || !isIsoDate(startDate) || !isIsoDate(endDate)) {
		return null;
	}

	return {
		competitionId,
		name,
		city,
		stateCode: state.code,
		stateName: state.name,
		startDate,
		endDate,
		wcaUrl:
			pickFirstString(item, ["wcaUrl", "url"]) ??
			`https://www.worldcubeassociation.org/competitions/${competitionId}`,
	};
}

export function summarizeUpcomingCompetitionsByState(
	items: readonly UpcomingCompetitionFeedItem[],
	options?: {
		limitPerState?: number;
		now?: Date;
	},
): Partial<Record<UsStateCode, UpcomingCompetition[]>> {
	const limitPerState = options?.limitPerState ?? 3;
	const today = (options?.now ?? new Date()).toISOString().slice(0, 10);
	const competitionsByState: Partial<Record<UsStateCode, UpcomingCompetition[]>> = {};

	const normalizedCompetitions = items
		.map((item) => normalizeUpcomingCompetition(item))
		.filter((item): item is UpcomingCompetition => item !== null)
		.filter((item) => item.endDate === null || item.endDate >= today)
		.sort((left, right) => {
			const dateCompare = left.startDate.localeCompare(right.startDate);
			if (dateCompare !== 0) {
				return dateCompare;
			}

			return left.competitionId.localeCompare(right.competitionId);
		});

	for (const competition of normalizedCompetitions) {
		const bucket = competitionsByState[competition.stateCode] ?? [];
		if (bucket.length >= limitPerState) {
			continue;
		}

		bucket.push(competition);
		competitionsByState[competition.stateCode] = bucket;
	}

	return competitionsByState;
}

export async function fetchUpcomingCompetitionsSnapshot(input: {
	feedUrl: string;
	fetchFn?: typeof fetch;
	limitPerState?: number;
	now?: Date;
}): Promise<UpcomingEnrichmentSnapshot> {
	const fetchFn = input.fetchFn ?? fetch;
	const fetchedAt = (input.now ?? new Date()).toISOString();

	try {
		const response = await fetchFn(input.feedUrl);
		if (!response.ok) {
			return {
				status: "degraded",
				competitionsByState: {},
				error: `Unexpected upcoming feed status: ${response.status}`,
				fetchedAt,
				sourceItemCount: 0,
			};
		}

		const payload = (await response.json()) as
			| UpcomingCompetitionFeedItem[]
			| { competitions?: UpcomingCompetitionFeedItem[] };

		const items = Array.isArray(payload) ? payload : payload.competitions ?? [];

		return {
			status: "ok",
			competitionsByState: summarizeUpcomingCompetitionsByState(items, {
				limitPerState: input.limitPerState,
				now: input.now,
			}),
			fetchedAt,
			sourceItemCount: items.length,
		};
	} catch (error) {
		return {
			status: "degraded",
			competitionsByState: {},
			error: error instanceof Error ? error.message : "Unknown upcoming feed error",
			fetchedAt,
			sourceItemCount: 0,
		};
	}
}
