import {
	Button,
	Container,
	Group,
	NativeSelect,
	SimpleGrid,
	Stack,
	Table,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { FormEvent } from "react";
import { useState } from "react";
import { CompetitionTables } from "#/components/CompetitionTables";
import {
	COVERAGE_SCOPE_OPTIONS,
	type CoverageScope,
	parseCoverageScope,
} from "#/lib/coverage-scopes";

type CompetitorSearch = {
	scope?: CoverageScope;
};

const loadCompetitorPage = createServerFn({
	method: "GET",
})
	.inputValidator((data: { wcaId: string; scope: CoverageScope }) => data)
	.handler(async ({ data }) => {
		const { getCompetitorPageData } = await import("#/lib/wca-site");
		return getCompetitorPageData(data.wcaId, data.scope);
	});

export const Route = createFileRoute("/competitors/$wcaId")({
	validateSearch: (search: Record<string, unknown>): CompetitorSearch => ({
		scope: parseCoverageScope(
			typeof search.scope === "string" ? search.scope : undefined,
		),
	}),
	loaderDeps: ({ search }) => ({
		scope: search.scope,
	}),
	loader: async ({ params, deps }) =>
		loadCompetitorPage({
			data: { wcaId: params.wcaId, scope: deps.scope ?? "us" },
		}),
	component: CompetitorPage,
});

function normalizeWcaId(value: string) {
	return value.trim().toUpperCase();
}

function isValidWcaId(value: string) {
	return /^\d{4}[A-Z]{4}\d{2}$/.test(value);
}

function formatTimestamp(value: string | null) {
	if (!value) {
		return "Unavailable";
	}

	return new Intl.DateTimeFormat("en-US", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "UTC",
	}).format(new Date(value));
}

type CompetitorLookupFormProps = {
	initialWcaId: string;
	initialScope: CoverageScope;
};

function CompetitorLookupForm({
	initialWcaId,
	initialScope,
}: CompetitorLookupFormProps) {
	const navigate = useNavigate();
	const [wcaId, setWcaId] = useState(initialWcaId);
	const [scope, setScope] = useState<CoverageScope>(initialScope);
	const [error, setError] = useState<string | null>(null);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const normalized = normalizeWcaId(wcaId);
		if (!isValidWcaId(normalized)) {
			setError("Enter a valid WCA ID like 2013FELI01.");
			return;
		}

		setError(null);
		void navigate({
			to: "/competitors/$wcaId",
			params: { wcaId: normalized },
			search: { scope },
		});
	}

	return (
		<form onSubmit={handleSubmit}>
			<Group align="end" gap="md">
				<TextInput
					label="Search another WCA ID"
					value={wcaId}
					onChange={(event) => setWcaId(event.currentTarget.value)}
					error={error}
					placeholder="Search another WCA ID"
					w={{ base: "100%", sm: 320 }}
				/>
				<NativeSelect
					label="Coverage scope"
					data={COVERAGE_SCOPE_OPTIONS}
					value={scope}
					onChange={(event) =>
						setScope(event.currentTarget.value as CoverageScope)
					}
					w={{ base: "100%", sm: 220 }}
				/>
				<Button type="submit" color="teal">
					Search
				</Button>
			</Group>
		</form>
	);
}

function CompetitorPage() {
	const params = Route.useParams();
	const data = Route.useLoaderData();

	const summaryRows = data.competitor
		? [
				["Visited regions", `${data.visitedRegionsCount}`],
				["Remaining regions", `${data.unvisitedRegions.length}`],
				[
					"Competitions in scope",
					`${data.competitor.totalCompetitions}`,
				],
				["Country", data.competitor.countryCode],
			]
		: [];

	const sourceRows = [
		[
			"Historical coverage source",
			`Updated ${formatTimestamp(data.historicalSourceUpdatedAt)} UTC`,
		],
		[
			"Upcoming competition source",
			data.upcomingStatus === "ok"
				? `Updated ${formatTimestamp(data.upcomingSourceUpdatedAt)} UTC`
				: "Temporarily unavailable. Historical coverage still reflects official participation.",
		],
	];

	return (
		<Container size="xl" px="md" py="xl">
			<Stack gap="xl">
				<section className="page-section page-section--muted">
					<Stack gap="lg">
						<Stack gap="xs" maw={840}>
							<Text className="eyebrow">Competitor lookup</Text>
							<Title order={1}>
								{data.competitor
									? data.competitor.name
									: "Competitor not found"}
							</Title>
							<Text size="lg" c="var(--text-soft)">
								{data.competitor
									? `${data.competitor.wcaId} has visited ${data.visitedRegionsCount} of ${data.totalRegions} ${data.regionLabelPlural} in the current dataset.`
									: `We could not find ${params.wcaId.toUpperCase()} in the current WCA source. Try another ID from the search page.`}
							</Text>
						</Stack>

						<CompetitorLookupForm
							key={`${params.wcaId}:${data.scope}`}
							initialWcaId={params.wcaId}
							initialScope={data.scope}
						/>
					</Stack>
				</section>

				{data.competitor ? (
					<>
						<SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
							<section className="page-section">
								<Stack gap="lg">
									<Stack gap={4}>
										<Text className="eyebrow">Summary</Text>
										<Title order={2}>
											Coverage snapshot
										</Title>
									</Stack>

									<Table withTableBorder>
										<tbody>
											{summaryRows.map(
												([label, value]) => (
													<tr key={label}>
														<th>{label}</th>
														<td>{value}</td>
													</tr>
												),
											)}
										</tbody>
									</Table>
								</Stack>
							</section>

							<section className="page-section">
								<Stack gap="lg">
									<Stack gap={4}>
										<Text className="eyebrow">
											Data sources
										</Text>
										<Title order={2}>
											Current dataset status
										</Title>
									</Stack>

									<Table withTableBorder>
										<tbody>
											{sourceRows.map(
												([label, value]) => (
													<tr key={label}>
														<th>{label}</th>
														<td>{value}</td>
													</tr>
												),
											)}
										</tbody>
									</Table>

									{data.upcomingError ? (
										<Text size="sm" c="var(--text-soft)">
											Source detail: {data.upcomingError}
										</Text>
									) : null}
								</Stack>
							</section>
						</SimpleGrid>

						<CompetitionTables
							scopeLabel={data.scopeLabel}
							visitedRegions={data.visitedRegions}
							unvisitedRegions={data.unvisitedRegions}
						/>
					</>
				) : (
					<section className="page-section">
						<Stack gap="md">
							<Text size="md" c="var(--text-soft)">
								Double-check the WCA ID and try again, or browse
								the current public leaderboard while you search.
							</Text>
							<Group gap="md">
								<Link to="/" className="no-underline">
									<Button variant="default">
										Back to search
									</Button>
								</Link>
								<Link
									to="/leaderboard"
									search={{ scope: data.scope }}
									className="no-underline"
								>
									<Button variant="default">
										View leaderboard
									</Button>
								</Link>
							</Group>
						</Stack>
					</section>
				)}
			</Stack>
		</Container>
	);
}
