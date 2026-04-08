import "dotenv/config";
import { Buffer } from "node:buffer";
import { createReadStream, createWriteStream } from "node:fs";
import { open, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createInflateRaw } from "node:zlib";
import postgres from "postgres";
import type { CoverageScope } from "../src/lib/coverage-scopes";
import {
	buildSeedRegionRows,
	mapCompetitionToRegionalInsert,
	type RegionalCompetitionInsertRow,
} from "../src/server/wca/region-ingestion";

const WCA_EXPORT_PUBLIC_URL =
	"https://www.worldcubeassociation.org/api/v0/export/public";

const REQUIRED_TSV_FILES = {
	competitions: "WCA_export_competitions.tsv",
	persons: "WCA_export_persons.tsv",
	results: "WCA_export_results.tsv",
} as const;

type PublicExportMetadata = {
	export_date: string;
	export_version?: string;
	export_format_version?: string;
	tsv_url: string;
};

type ZipEntry = {
	fileName: string;
	compressionMethod: number;
	compressedSize: number;
	localHeaderOffset: number;
};

type TsvHeaderMap = Map<string, number>;

type PersonInsert = {
	wca_id: string;
	name: string;
	country_id: string;
};

type ScopeDiagnostics = {
	mappedCompetitions: number;
	skippedCompetitions: number;
	skippedReasons: Record<"unmapped-region" | "invalid-date", number>;
	distinctRegionCodes: Set<string>;
};

function createScopeDiagnostics(): Record<CoverageScope, ScopeDiagnostics> {
	return {
		us: {
			mappedCompetitions: 0,
			skippedCompetitions: 0,
			skippedReasons: {
				"unmapped-region": 0,
				"invalid-date": 0,
			},
			distinctRegionCodes: new Set<string>(),
		},
		ca: {
			mappedCompetitions: 0,
			skippedCompetitions: 0,
			skippedReasons: {
				"unmapped-region": 0,
				"invalid-date": 0,
			},
			distinctRegionCodes: new Set<string>(),
		},
		eng: {
			mappedCompetitions: 0,
			skippedCompetitions: 0,
			skippedReasons: {
				"unmapped-region": 0,
				"invalid-date": 0,
			},
			distinctRegionCodes: new Set<string>(),
		},
	};
}

function requireConnectionString() {
	const value =
		process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_POOLER_URL;
	if (!value) {
		throw new Error(
			"DATABASE_DIRECT_URL or DATABASE_POOLER_URL must be set to run weekly ingestion.",
		);
	}

	return value;
}

function createHeaderIndex(line: string) {
	const headers = line.split("\t");
	const map = new Map<string, number>();
	for (let index = 0; index < headers.length; index += 1) {
		map.set(headers[index], index);
	}
	return map;
}

function getField(cells: string[], headers: TsvHeaderMap, name: string) {
	const index = headers.get(name);
	if (index === undefined) {
		return "";
	}

	return cells[index] ?? "";
}

function toIsoDate(yearRaw: string, monthRaw: string, dayRaw: string) {
	const year = Number.parseInt(yearRaw, 10);
	const month = Number.parseInt(monthRaw, 10);
	const day = Number.parseInt(dayRaw, 10);

	if (
		!Number.isInteger(year) ||
		!Number.isInteger(month) ||
		!Number.isInteger(day)
	) {
		return null;
	}
	if (year < 1980 || month < 1 || month > 12 || day < 1 || day > 31) {
		return null;
	}

	return `${`${year}`.padStart(4, "0")}-${`${month}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
}

async function fetchPublicExportMetadata(): Promise<PublicExportMetadata> {
	const response = await fetch(WCA_EXPORT_PUBLIC_URL, {
		headers: {
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`Unable to fetch WCA export metadata (${response.status}).`);
	}

	const payload = (await response.json()) as PublicExportMetadata;
	if (!payload.export_date || !payload.tsv_url) {
		throw new Error("WCA export metadata is missing export_date or tsv_url.");
	}

	return payload;
}

async function downloadToFile(url: string, targetPath: string) {
	const response = await fetch(url);
	if (!response.ok || !response.body) {
		throw new Error(
			`Unable to download WCA export TSV zip (${response.status}).`,
		);
	}

	await pipeline(
		Readable.fromWeb(response.body as any),
		createWriteStream(targetPath),
	);
}

async function readZipEntries(zipPath: string) {
	const file = await open(zipPath, "r");
	try {
		const stat = await file.stat();
		const tailSize = Math.min(stat.size, 66_000);
		const tail = Buffer.alloc(tailSize);
		await file.read(tail, 0, tailSize, stat.size - tailSize);

		let eocdOffset = -1;
		for (let index = tail.length - 22; index >= 0; index -= 1) {
			if (tail.readUInt32LE(index) === 0x06054b50) {
				eocdOffset = index;
				break;
			}
		}

		if (eocdOffset < 0) {
			throw new Error(
				"Unable to locate ZIP central directory (EOCD not found).",
			);
		}

		const centralDirectorySize = tail.readUInt32LE(eocdOffset + 12);
		const centralDirectoryOffset = tail.readUInt32LE(eocdOffset + 16);

		const directoryBuffer = Buffer.alloc(centralDirectorySize);
		await file.read(
			directoryBuffer,
			0,
			centralDirectorySize,
			centralDirectoryOffset,
		);

		const entries = new Map<string, ZipEntry>();
		let offset = 0;
		while (offset < directoryBuffer.length) {
			const signature = directoryBuffer.readUInt32LE(offset);
			if (signature !== 0x02014b50) {
				break;
			}

			const compressionMethod = directoryBuffer.readUInt16LE(offset + 10);
			const compressedSize = directoryBuffer.readUInt32LE(offset + 20);
			const fileNameLength = directoryBuffer.readUInt16LE(offset + 28);
			const extraFieldLength = directoryBuffer.readUInt16LE(offset + 30);
			const fileCommentLength = directoryBuffer.readUInt16LE(offset + 32);
			const localHeaderOffset = directoryBuffer.readUInt32LE(offset + 42);

			const fileName = directoryBuffer.toString(
				"utf8",
				offset + 46,
				offset + 46 + fileNameLength,
			);

			entries.set(fileName, {
				fileName,
				compressionMethod,
				compressedSize,
				localHeaderOffset,
			});

			offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
		}

		return entries;
	} finally {
		await file.close();
	}
}

async function createZipEntryStream(zipPath: string, entry: ZipEntry) {
	const file = await open(zipPath, "r");
	try {
		const localHeader = Buffer.alloc(30);
		await file.read(localHeader, 0, 30, entry.localHeaderOffset);

		if (localHeader.readUInt32LE(0) !== 0x04034b50) {
			throw new Error(`Invalid ZIP local header for ${entry.fileName}.`);
		}

		const fileNameLength = localHeader.readUInt16LE(26);
		const extraFieldLength = localHeader.readUInt16LE(28);
		const dataOffset =
			entry.localHeaderOffset + 30 + fileNameLength + extraFieldLength;
		const dataEnd = dataOffset + entry.compressedSize - 1;

		const compressedStream = createReadStream(zipPath, {
			start: dataOffset,
			end: dataEnd,
		});

		if (entry.compressionMethod === 0) {
			return compressedStream;
		}
		if (entry.compressionMethod === 8) {
			return compressedStream.pipe(createInflateRaw());
		}

		throw new Error(
			`Unsupported ZIP compression method ${entry.compressionMethod} for ${entry.fileName}.`,
		);
	} finally {
		await file.close();
	}
}

async function streamTsvRows(
	zipPath: string,
	entry: ZipEntry,
	onRow: (cells: string[], headers: TsvHeaderMap) => void,
) {
	const stream = await createZipEntryStream(zipPath, entry);
	const reader = createInterface({
		input: stream,
		crlfDelay: Infinity,
	});

	let headers: TsvHeaderMap | null = null;
	for await (const line of reader) {
		if (!headers) {
			headers = createHeaderIndex(line);
			continue;
		}

		if (line.length === 0) {
			continue;
		}

		onRow(line.split("\t"), headers);
	}
}

async function insertRowsInChunks<T extends Record<string, unknown>>(input: {
	tx: any;
	tableName: string;
	columns: readonly string[];
	rows: readonly T[];
	chunkSize?: number;
}) {
	const chunkSize = input.chunkSize ?? 2_000;
	for (let offset = 0; offset < input.rows.length; offset += chunkSize) {
		const chunk = input.rows.slice(offset, offset + chunkSize);
		if (chunk.length === 0) {
			continue;
		}

		await input.tx`
			insert into ${input.tx(input.tableName)}
			${input.tx(chunk, ...input.columns)}
		`;
	}
}

async function run() {
	const metadata = await fetchPublicExportMetadata();
	const exportDate = new Date(metadata.export_date).toISOString();
	const exportFormatVersion =
		metadata.export_format_version ?? metadata.export_version ?? "unknown";
	const zipPath = join(tmpdir(), `wca-weekly-export-${Date.now()}.tsv.zip`);
	const sql = postgres(requireConnectionString(), {
		max: 1,
	});

	let runId: number | null = null;

	try {
		const existingRuns = await sql<{
			id: number;
			status: "started" | "succeeded" | "failed" | "skipped";
		}[]>`
      select id, status
      from wca_export_runs
      where export_date = ${exportDate}::timestamptz
      limit 1
    `;

		const existingRun = existingRuns[0];
		if (existingRun?.status === "succeeded") {
			await sql`
        update wca_export_runs
        set skipped_reason = ${`Already ingested on ${new Date().toISOString()}`}
        where id = ${existingRun.id}
      `;
			console.log(`Skipped export ${exportDate} because it already succeeded.`);
			return;
		}

		if (existingRun) {
			runId = existingRun.id;
			await sql`
        update wca_export_runs
        set
          status = 'started',
          started_at = now(),
          finished_at = null,
          error = null,
          skipped_reason = null
        where id = ${runId}
      `;
		} else {
			const inserted = await sql<{ id: number }[]>`
        insert into wca_export_runs (
          export_date,
          export_format_version,
          tsv_url,
          status
        )
        values (
          ${exportDate}::timestamptz,
          ${exportFormatVersion},
          ${metadata.tsv_url},
          'started'
        )
        returning id
      `;
			runId = inserted[0].id;
		}

		console.log("Downloading weekly TSV export...");
		await downloadToFile(metadata.tsv_url, zipPath);
		console.log(`Saved ZIP to ${zipPath}`);

		const entries = await readZipEntries(zipPath);
		const competitionsEntry = entries.get(REQUIRED_TSV_FILES.competitions);
		const personsEntry = entries.get(REQUIRED_TSV_FILES.persons);
		const resultsEntry = entries.get(REQUIRED_TSV_FILES.results);

		if (!competitionsEntry || !personsEntry || !resultsEntry) {
			throw new Error("Missing required TSV files in WCA export ZIP.");
		}

		console.log("Parsing persons TSV...");
		const peopleById = new Map<
			string,
			{
				subId: number;
				row: PersonInsert;
			}
		>();
		const personIdSet = new Set<string>();
		await streamTsvRows(zipPath, personsEntry, (cells, headers) => {
			const wcaId = getField(cells, headers, "wca_id").trim().toUpperCase();
			if (!wcaId) {
				return;
			}

			const subIdRaw = getField(cells, headers, "sub_id").trim();
			const subId = Number.parseInt(subIdRaw, 10);
			const normalizedSubId = Number.isInteger(subId) ? subId : 0;

			const person = {
				wca_id: wcaId,
				name: getField(cells, headers, "name").trim(),
				country_id: getField(cells, headers, "country_id").trim(),
			} satisfies PersonInsert;

			const existing = peopleById.get(wcaId);
			if (!existing || normalizedSubId > existing.subId) {
				peopleById.set(wcaId, {
					subId: normalizedSubId,
					row: person,
				});
			}

			personIdSet.add(wcaId);
		});
		const peopleRows = [...peopleById.values()].map((value) => value.row);
		const regionRows = buildSeedRegionRows();

		console.log("Parsing competitions TSV...");
		const competitionMap = new Map<string, RegionalCompetitionInsertRow>();
		const scopeDiagnostics = createScopeDiagnostics();
		await streamTsvRows(zipPath, competitionsEntry, (cells, headers) => {
			const competitionId = getField(cells, headers, "id").trim();
			const countryId = getField(cells, headers, "country_id").trim();
			const cancelled = getField(cells, headers, "cancelled").trim() === "1";
			const cityName = getField(cells, headers, "city_name").trim();
			const venueAddressRaw = getField(cells, headers, "venue_address").trim();
			const venueAddress = venueAddressRaw.length > 0 ? venueAddressRaw : null;
			const startDate = toIsoDate(
				getField(cells, headers, "year"),
				getField(cells, headers, "month"),
				getField(cells, headers, "day"),
			);
			const endDate = toIsoDate(
				getField(cells, headers, "end_year"),
				getField(cells, headers, "end_month"),
				getField(cells, headers, "end_day"),
			);

			const mapping = mapCompetitionToRegionalInsert({
				competitionId,
				countryId,
				name: getField(cells, headers, "name").trim(),
				cityName,
				venueAddress,
				startDate,
				endDate,
				cancelled,
			});

			if (mapping.status === "ignored") {
				return;
			}

			if (mapping.status === "skipped") {
				scopeDiagnostics[mapping.scope].skippedCompetitions += 1;
				scopeDiagnostics[mapping.scope].skippedReasons[mapping.reason] += 1;
				return;
			}

			competitionMap.set(mapping.row.competition_id, mapping.row);
			scopeDiagnostics[mapping.scope].mappedCompetitions += 1;
			scopeDiagnostics[mapping.scope].distinctRegionCodes.add(
				mapping.row.region_code,
			);
		});

		const competitionRows = [...competitionMap.values()];
		const regionalCompetitionIdSet = new Set(
			competitionRows.map((row) => row.competition_id),
		);
		const distinctStatesCount = new Set(
			competitionRows.map((row) => `${row.country_iso2}:${row.region_code}`),
		).size;

		console.log("Parsing results TSV...");
		const personCompetitionPairs = new Set<string>();
		await streamTsvRows(zipPath, resultsEntry, (cells, headers) => {
			const competitionId = getField(cells, headers, "competition_id").trim();
			const personId = getField(cells, headers, "person_id")
				.trim()
				.toUpperCase();

			if (!competitionId || !personId) {
				return;
			}
			if (!regionalCompetitionIdSet.has(competitionId)) {
				return;
			}
			if (!personIdSet.has(personId)) {
				return;
			}

			personCompetitionPairs.add(`${personId}\t${competitionId}`);
		});

		console.log("Publishing to database...");
		await sql.begin(async (transaction) => {
			const tx = transaction as any;

			await tx`delete from person_country_region_summary`;
			await tx`delete from person_regional_competitions`;
			await tx`delete from regional_competitions`;
			await tx`delete from wca_regions`;
			await tx`delete from wca_people`;

			await insertRowsInChunks({
				tx,
				tableName: "wca_people",
				columns: ["wca_id", "name", "country_id"],
				rows: peopleRows,
			});

			await insertRowsInChunks({
				tx,
				tableName: "wca_regions",
				columns: [
					"country_iso2",
					"region_code",
					"region_name",
					"region_level",
					"is_selectable",
				],
				rows: regionRows,
			});

			await insertRowsInChunks({
				tx,
				tableName: "regional_competitions",
				columns: [
					"competition_id",
					"country_iso2",
					"region_code",
					"name",
					"city_name",
					"venue_address",
					"start_date",
					"end_date",
					"cancelled",
				],
				rows: competitionRows,
			});

			const pairBatch: Array<{ wca_id: string; competition_id: string }> = [];
			const flushPairs = async () => {
				if (pairBatch.length === 0) {
					return;
				}

				await tx`
          insert into person_regional_competitions
          ${tx(pairBatch, "wca_id", "competition_id")}
          on conflict do nothing
        `;
				pairBatch.length = 0;
			};

			for (const key of personCompetitionPairs) {
				const [wcaId, competitionId] = key.split("\t");
				pairBatch.push({
					wca_id: wcaId,
					competition_id: competitionId,
				});
				if (pairBatch.length >= 2_000) {
					await flushPairs();
				}
			}
			await flushPairs();

			await tx`
        insert into person_country_region_summary (
          wca_id,
          country_iso2,
          visited_regions_count,
          country_competitions_count,
          updated_at
        )
        select
          person_regional_competitions.wca_id,
          regional_competitions.country_iso2,
          count(distinct regional_competitions.region_code)::int as visited_regions_count,
          count(*)::int as country_competitions_count,
          now()
        from person_regional_competitions
        inner join regional_competitions
          on regional_competitions.competition_id = person_regional_competitions.competition_id
        group by
          person_regional_competitions.wca_id,
          regional_competitions.country_iso2
      `;
		});

		const totalSkippedCompetitions = Object.values(scopeDiagnostics).reduce(
			(sum, diagnostics) => sum + diagnostics.skippedCompetitions,
			0,
		);

		await sql`
      update wca_export_runs
      set
        status = 'succeeded',
        finished_at = now(),
        error = null,
        people_count = ${peopleRows.length},
        competitions_count = ${competitionRows.length},
        person_competition_pairs_count = ${personCompetitionPairs.size},
        states_mapped_count = ${distinctStatesCount},
        skipped_reason = ${totalSkippedCompetitions > 0
					? `${totalSkippedCompetitions} supported competitions could not be mapped to a configured region.`
					: null}
      where id = ${runId}
    `;

		console.log("Weekly export ingestion complete.");
		console.log(
			JSON.stringify(
				{
					exportDate,
					peopleCount: peopleRows.length,
					regionSeedCount: regionRows.length,
					competitionsCount: competitionRows.length,
					personCompetitionPairsCount: personCompetitionPairs.size,
					distinctStatesCount,
					scopeDiagnostics: Object.fromEntries(
						Object.entries(scopeDiagnostics).map(([scope, diagnostics]) => [
							scope,
							{
								mappedCompetitions: diagnostics.mappedCompetitions,
								skippedCompetitions: diagnostics.skippedCompetitions,
								skippedReasons: diagnostics.skippedReasons,
								distinctRegionsCount: diagnostics.distinctRegionCodes.size,
							},
						]),
					),
				},
				null,
				2,
			),
		);
	} catch (error) {
		if (runId !== null) {
			const message =
				error instanceof Error ? error.message : "Unknown ingestion failure";
			await sql`
        update wca_export_runs
        set
          status = 'failed',
          finished_at = now(),
          error = ${message}
        where id = ${runId}
      `;
		}
		throw error;
	} finally {
		await sql.end({ timeout: 5 });
		await rm(zipPath, { force: true });
	}
}

void run().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
