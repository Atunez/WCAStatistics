import {
	Badge,
	Button,
	Container,
	Group,
	NativeSelect,
	Paper,
	SimpleGrid,
	Stack,
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

function StatCard({ label, value }: { label: string; value: string | number }) {
	return (
		<Paper className="island-shell" p="lg">
			<Stack gap={4}>
				<Text size="xs" tt="uppercase" fw={700} c="var(--kicker)">
					{label}
				</Text>
				<Title order={2}>{value}</Title>
			</Stack>
		</Paper>
	);
}

function CompetitorPage() {
	const navigate = useNavigate();
	const params = Route.useParams();
	const data = Route.useLoaderData();
	const [wcaId, setWcaId] = useState(params.wcaId);
	const [scope, setScope] = useState<CoverageScope>(data.scope);
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
					className="island-shell"
					radius="32px"
					p={{ base: "xl", sm: "3rem" }}
				>
					<Group justify="space-between" align="end" gap="xl">
						<Stack gap="md" maw={760}>
							<Badge
								variant="light"
								color="teal"
								size="lg"
								w="fit-content"
							>
								Competitor lookup
							</Badge>
							<Title order={1}>
								{data.competitor
									? data.competitor.name
									: "Competitor not found"}
							</Title>
							<Text size="lg" c="dimmed">
								{data.competitor
									? `${data.competitor.wcaId} has visited ${data.visitedRegionsCount} of ${data.totalRegions} ${data.regionLabelPlural} in the current dataset.`
									: `We could not find ${params.wcaId.toUpperCase()} in the current WCA source. Try another ID from the homepage search.`}
							</Text>
						</Stack>

						<form onSubmit={handleSubmit}>
							<Group align="end" gap="md">
								<TextInput
									label="Search another WCA ID"
									value={wcaId}
									onChange={(event) =>
										setWcaId(event.currentTarget.value)
									}
									error={error}
									placeholder="Search another WCA ID"
									w={{ base: "100%", sm: 320 }}
								/>
								<NativeSelect
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
								<Button type="submit" color="teal">
									Search
								</Button>
							</Group>
						</form>
					</Group>
				</Paper>

				{data.competitor ? (
					<>
						<SimpleGrid
							cols={{ base: 1, sm: 2, xl: 4 }}
							spacing="md"
						>
							<StatCard
								label="Visited regions"
								value={data.visitedRegionsCount}
							/>
							<StatCard
								label="Remaining regions"
								value={data.unvisitedRegions.length}
							/>
							<StatCard
								label="Competitions in scope"
								value={data.competitor.totalCompetitions}
							/>
							<StatCard
								label="Country"
								value={data.competitor.countryCode}
							/>
						</SimpleGrid>

						<SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
							<Paper className="island-shell" p="lg">
								<Stack gap={4}>
									<Text
										size="xs"
										tt="uppercase"
										fw={700}
										c="var(--kicker)"
									>
										Historical coverage source
									</Text>
									<Text size="sm" c="dimmed">
										Updated{" "}
										{formatTimestamp(
											data.historicalSourceUpdatedAt,
										)}{" "}
										UTC
									</Text>
								</Stack>
							</Paper>
							<Paper className="island-shell" p="lg">
								<Stack gap={4}>
									<Text
										size="xs"
										tt="uppercase"
										fw={700}
										c="var(--kicker)"
									>
										Upcoming competition source
									</Text>
									<Text size="sm" c="dimmed">
										{data.upcomingStatus === "ok"
											? `Updated ${formatTimestamp(data.upcomingSourceUpdatedAt)} UTC`
											: "Temporarily unavailable - historical region coverage still reflects official participation."}
									</Text>
									{data.upcomingError ? (
										<Text size="sm" c="dimmed">
											{data.upcomingError}
										</Text>
									) : null}
								</Stack>
							</Paper>
						</SimpleGrid>

						<CompetitionTables
							scopeLabel={data.scopeLabel}
							visitedRegions={data.visitedRegions}
							unvisitedRegions={data.unvisitedRegions}
						/>
					</>
				) : (
					<Paper className="island-shell" p="xl">
						<Stack gap="md">
							<Text size="md" c="dimmed">
								Double-check the WCA ID and try again, or browse
								the current public leaderboard while you search.
							</Text>
							<Group gap="md">
								<Link to="/" className="no-underline">
									<Button variant="light" color="teal">
										Back to search
									</Button>
								</Link>
								<Link
									to="/leaderboard"
									search={{ scope: data.scope }}
									className="no-underline"
								>
									<Button variant="light" color="gray">
										View leaderboard
									</Button>
								</Link>
							</Group>
						</Stack>
					</Paper>
				)}
			</Stack>
		</Container>
	);
}
