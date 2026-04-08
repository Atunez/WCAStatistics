import {
	Badge,
	Button,
	Container,
	Group,
	NativeSelect,
	Paper,
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
				<Paper
					className="island-shell rise-in relative overflow-hidden"
					radius="32px"
					p={{ base: "xl", sm: "3rem" }}
				>
					<Stack gap="lg">
						<Badge
							variant="light"
							color="teal"
							size="lg"
							w="fit-content"
						>
							Track regional coverage across the WCA
						</Badge>
						<Title order={1} fz={{ base: 40, sm: 64 }} maw={860}>
							See which regions your WCA career has already
							reached.
						</Title>
						<Text size="lg" c="dimmed" maw={760}>
							Search by WCA ID to compare visited and unvisited
							regions across the United States, Canada, and
							England. Review the last three competitions in each
							region and spot upcoming opportunities where
							coverage is still missing.
						</Text>

						<form onSubmit={handleSubmit}>
							<Group align="end" gap="md">
								<TextInput
									flex={1}
									size="lg"
									label="WCA ID"
									placeholder="Enter a WCA ID, like 2013FELI01"
									value={wcaId}
									onChange={(event) =>
										setWcaId(event.currentTarget.value)
									}
									error={error}
								/>
								<NativeSelect
									size="lg"
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
								<Button
									type="submit"
									size="lg"
									variant="filled"
									color="teal"
								>
									Open competitor page
								</Button>
							</Group>
							{!error ? (
								<Text mt="sm" size="sm" c="dimmed">
									Valid IDs look like four digits, four
									letters, and two digits.
								</Text>
							) : null}
						</form>
					</Stack>
				</Paper>

				<SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
					{[
						[
							`${usScope.regions.length} U.S. regions`,
							"Includes the 50 states plus 5 inhabited U.S. territories.",
						],
						[
							`${canadaScope.regions.length} Canadian regions`,
							"Covers all provinces and territories across Canada.",
						],
						[
							`${englandScope.regions.length} English regions`,
							"Tracks England using the 48 ceremonial counties.",
						],
					].map(([title, description]) => (
						<Paper
							key={title}
							className="island-shell feature-card"
							p="lg"
						>
							<Stack gap="xs">
								<Title order={3} fz="h4">
									{title}
								</Title>
								<Text size="sm" c="dimmed">
									{description}
								</Text>
							</Stack>
						</Paper>
					))}
				</SimpleGrid>

				<SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
					<Paper className="island-shell" p="xl">
						<Group justify="space-between" align="start" mb="lg">
							<Stack gap={4}>
								<Text
									size="xs"
									tt="uppercase"
									fw={700}
									c="var(--kicker)"
								>
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
								<Button variant="light" color="teal">
									View top 100
								</Button>
							</Link>
						</Group>

						<Table
							highlightOnHover
							withTableBorder
							withColumnBorders={false}
						>
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
												<Text fw={700} c="teal.7">
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
					</Paper>

					<Paper className="island-shell" p="xl">
						<Stack gap="md">
							<Text
								size="xs"
								tt="uppercase"
								fw={700}
								c="var(--kicker)"
							>
								How it works
							</Text>
							<Title order={2}>
								What you will see on each competitor page
							</Title>
							<Stack gap="sm">
								<Text size="sm" c="dimmed">
									Visited-region totals based on official WCA
									competition history within the selected
									scope.
								</Text>
								<Text size="sm" c="dimmed">
									Every region in exactly one bucket: visited
									or unvisited.
								</Text>
								<Text size="sm" c="dimmed">
									The last three historical competitions
									available for each region.
								</Text>
								<Text size="sm" c="dimmed">
									A scope-specific leaderboard ordered by
									visited region count.
								</Text>
								<Text size="sm" c="dimmed">
									A clear degraded state if the historical
									dataset is unavailable in the current
									runtime.
								</Text>
							</Stack>
						</Stack>
					</Paper>
				</SimpleGrid>
			</Stack>
		</Container>
	);
}
