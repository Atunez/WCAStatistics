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
import {
	COVERAGE_SCOPE_OPTIONS,
	type CoverageScope,
	DEFAULT_SCOPE,
	getCoverageScopeConfig,
} from "#/lib/coverage-scopes";

const loadLeaderboardPreview = createServerFn({
	method: "GET",
}).handler(async () => {
	const { getLeaderboardEntries } = await import("#/lib/wca-site");
	return getLeaderboardEntries({ n: 10, scope: DEFAULT_SCOPE });
});

const usScope = getCoverageScopeConfig("us");
const canadaScope = getCoverageScopeConfig("ca");
const englandScope = getCoverageScopeConfig("eng");

const scopeRows = [
	{
		scope: usScope.label,
		regions: usScope.regions.length,
		description: "50 states plus 5 inhabited U.S. territories.",
	},
	{
		scope: canadaScope.label,
		regions: canadaScope.regions.length,
		description: "All Canadian provinces and territories.",
	},
	{
		scope: englandScope.label,
		regions: englandScope.regions.length,
		description: "England tracked by 48 ceremonial counties.",
	},
];

const competitorPageNotes = [
	"Visited-region totals based on official WCA participation in the selected scope.",
	"Every region appears in exactly one bucket: visited or remaining.",
	"The latest completed event and next listed opportunity for each region.",
	"A deterministic leaderboard ordered by visited-region count and WCA ID.",
	"A fallback state if the upcoming-events catalog is unavailable.",
];

export const Route = createFileRoute("/")({
	loader: async () => loadLeaderboardPreview(),
	component: HomePage,
});

function normalizeWcaId(value: string) {
	return value.trim().toUpperCase();
}

function isValidWcaId(value: string) {
	return /^\d{4}[A-Z]{4}\d{2}$/.test(value);
}

function HomePage() {
	const navigate = useNavigate();
	const leaderboardPreview = Route.useLoaderData();
	const [wcaId, setWcaId] = useState("");
	const [scope, setScope] = useState<CoverageScope>(DEFAULT_SCOPE);
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
		<Container size="xl" px="md" py="xl">
			<Stack gap="xl">
				<section className="page-section page-section--muted rise-in">
					<Stack gap="lg">
						<Stack gap="xs" maw={840}>
							<Text className="eyebrow">Competitor search</Text>
							<Title order={1}>
								Check WCA region coverage by competitor
							</Title>
							<Text size="lg" c="var(--text-soft)">
								Search by WCA ID to compare visited and
								unvisited regions across the United States,
								Canada, and England. The competitor page keeps
								the output focused on coverage, recent history,
								and next opportunities.
							</Text>
						</Stack>

						<form onSubmit={handleSubmit}>
							<Group align="end" gap="md">
								<TextInput
									flex={1}
									size="md"
									label="WCA ID"
									placeholder="Enter a WCA ID, like 2013FELI01"
									value={wcaId}
									onChange={(event) =>
										setWcaId(event.currentTarget.value)
									}
									error={error}
								/>
								<NativeSelect
									size="md"
									label="Coverage scope"
									data={COVERAGE_SCOPE_OPTIONS}
									value={scope}
									onChange={(event) =>
										setScope(
											event.currentTarget
												.value as CoverageScope,
										)
									}
									w={{ base: "100%", sm: 220 }}
								/>
								<Button type="submit" size="md" color="teal">
									Open competitor page
								</Button>
							</Group>
							{!error ? (
								<Text mt="sm" size="sm" c="var(--text-soft)">
									Valid IDs use four digits, four letters, and
									two digits.
								</Text>
							) : null}
						</form>
					</Stack>
				</section>

				<SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
					<section className="page-section">
						<Stack gap="lg">
							<Stack gap={4}>
								<Text className="eyebrow">Coverage scopes</Text>
								<Title order={2}>Supported region sets</Title>
							</Stack>

							<Table withTableBorder>
								<thead>
									<tr>
										<th>Scope</th>
										<th>Regions</th>
										<th>Notes</th>
									</tr>
								</thead>
								<tbody>
									{scopeRows.map((row) => (
										<tr key={row.scope}>
											<td>{row.scope}</td>
											<td>{row.regions}</td>
											<td>{row.description}</td>
										</tr>
									))}
								</tbody>
							</Table>
						</Stack>
					</section>

					<section className="page-section">
						<Stack gap="lg">
							<Stack gap={4}>
								<Text className="eyebrow">What you get</Text>
								<Title order={2}>
									Competitor pages stay simple
								</Title>
							</Stack>

							<ul className="basic-list">
								{competitorPageNotes.map((note) => (
									<li key={note}>{note}</li>
								))}
							</ul>
						</Stack>
					</section>
				</SimpleGrid>

				<section className="page-section">
					<Stack gap="lg">
						<Group justify="space-between" align="end" gap="md">
							<Stack gap={4}>
								<Text className="eyebrow">
									Leaderboard preview
								</Text>
								<Title order={2}>
									Current top competitors in the U.S.
								</Title>
							</Stack>
							<Link
								to="/leaderboard"
								search={{ scope: DEFAULT_SCOPE }}
								className="no-underline"
							>
								<Button variant="default">View top 100</Button>
							</Link>
						</Group>

						<Table highlightOnHover withTableBorder>
							<thead>
								<tr>
									<th>Rank</th>
									<th>Competitor</th>
									<th>WCA ID</th>
									<th>Visited regions</th>
								</tr>
							</thead>
							<tbody>
								{leaderboardPreview.map((entry) => (
									<tr key={entry.wcaId}>
										<td>#{entry.rank}</td>
										<td>
											<Link
												to="/competitors/$wcaId"
												params={{ wcaId: entry.wcaId }}
												search={{
													scope: DEFAULT_SCOPE,
												}}
												className="no-underline"
											>
												<Text
													fw={700}
													c="var(--accent)"
												>
													{entry.name}
												</Text>
											</Link>
										</td>
										<td>{entry.wcaId}</td>
										<td>{entry.visitedRegionsCount}</td>
									</tr>
								))}
							</tbody>
						</Table>
					</Stack>
				</section>
			</Stack>
		</Container>
	);
}
