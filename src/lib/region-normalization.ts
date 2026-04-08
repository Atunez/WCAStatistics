import type { CoverageScope } from "./coverage-scopes";
import { getCoverageScopeConfig } from "./coverage-scopes";
import {
	createRegionLookup,
	normalizeRegionLookupToken,
	type Region,
} from "./region-catalog";

const lookupCache = new Map<
	CoverageScope,
	ReturnType<typeof createRegionLookup<Region>>
>();

function getRegionLookup(scope: CoverageScope) {
	const existing = lookupCache.get(scope);
	if (existing) {
		return existing;
	}

	const created = createRegionLookup(getCoverageScopeConfig(scope).regions);
	lookupCache.set(scope, created);
	return created;
}

function isBlockedWholeValue(scope: CoverageScope, value: string): boolean {
	if (scope !== "us") {
		return false;
	}

	return (
		value === "washington dc" ||
		value === "washington, dc" ||
		value === "district of columbia"
	);
}

function isMultiLocationValue(value: string): boolean {
	return (
		value === "multiple cities" ||
		value === "multiple locations" ||
		value === "see locations tab"
	);
}

function splitLocationTokens(value: string): string[] {
	return value
		.split(",")
		.flatMap((segment) => segment.split("/"))
		.map((segment) => segment.trim())
		.filter(Boolean);
}

function getUsOrCaAddressCode(
	scope: CoverageScope,
	address: string,
): string | null {
	const lookup = getRegionLookup(scope);

	if (scope === "us") {
		const match = address.match(/\b([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/);
		if (!match) {
			return null;
		}

		return (
			lookup.byToken.get(normalizeRegionLookupToken(match[1]))?.code ??
			null
		);
	}

	if (scope === "ca") {
		const match = address.match(
			/\b([A-Z]{2})\b(?=(?:\s+[A-Z]\d[A-Z]\s?\d[A-Z]\d\b)|(?:\s*$))/i,
		);
		if (!match) {
			return null;
		}

		return (
			lookup.byToken.get(normalizeRegionLookupToken(match[1]))?.code ??
			null
		);
	}

	return null;
}

export function getRegionByCode(
	scope: CoverageScope,
	code: string | null | undefined,
): Region | null {
	if (!code) {
		return null;
	}

	return getRegionLookup(scope).byCode.get(code.trim().toUpperCase()) ?? null;
}

export function normalizeRegion(
	scope: CoverageScope,
	value: string | null | undefined,
): Region | null {
	if (!value) {
		return null;
	}

	const normalizedValue = normalizeRegionLookupToken(value);
	if (
		isBlockedWholeValue(scope, normalizedValue) ||
		isMultiLocationValue(normalizedValue)
	) {
		return null;
	}

	const lookup = getRegionLookup(scope);
	const directMatch = lookup.byToken.get(normalizedValue);
	if (directMatch) {
		return directMatch;
	}

	for (const segment of splitLocationTokens(value)) {
		const match = lookup.byToken.get(normalizeRegionLookupToken(segment));
		if (match) {
			return match;
		}
	}

	return null;
}

export function extractCompetitionRegion(input: {
	scope: CoverageScope;
	city?: string | null;
	venueAddress?: string | null;
}): Region | null {
	const { scope, city, venueAddress } = input;
	const values = [city, venueAddress].filter((value): value is string =>
		Boolean(value?.trim()),
	);

	if (
		values.some((value) =>
			isMultiLocationValue(normalizeRegionLookupToken(value)),
		)
	) {
		return null;
	}

	for (const value of values) {
		const normalizedValue = normalizeRegionLookupToken(value);
		if (isBlockedWholeValue(scope, normalizedValue)) {
			continue;
		}

		const exactMatch = normalizeRegion(scope, value);
		if (exactMatch) {
			return exactMatch;
		}

		const segments = splitLocationTokens(value);
		for (let index = segments.length - 1; index >= 0; index -= 1) {
			const match = normalizeRegion(scope, segments[index]);
			if (match) {
				return match;
			}
		}
	}

	if (venueAddress) {
		const codeMatch = getUsOrCaAddressCode(scope, venueAddress);
		if (codeMatch) {
			return getRegionByCode(scope, codeMatch);
		}
	}

	return null;
}
