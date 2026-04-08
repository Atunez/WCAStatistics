import {
	Button,
	Container,
	Group,
	NativeSelect,
	Paper,
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
	getCoverageScopeConfig,
	parseCoverageScope,
} from "#/lib/coverage-scopes";
import { parseLeaderboardLimit } from "#/lib/leaderboard-limit";

type LeaderboardSearch = {
	n?: string;
	scope?: CoverageScope;
};

const loadLeaderboardPage = createServerFn({
	method: "GET",
})
	.inputValidator((data: { n: number; scope: CoverageScope }) => data)
	.handler(async ({ data }) => {
		const { getLeaderboardEntries, getLeaderboardGeneratedAt } =
			await import("#/lib/wca-site");
		const [entries, generatedAt] = await Promise.all([
			getLeaderboardEntries({ n: data.n, scope: data.scope }),
			getLeaderboardGeneratedAt(),
		]);
		const scopeConfig = getCoverageScopeConfig(data.scope);

		return {
			entries,
			generatedAt,
			n: data.n,
			scope: data.scope,
			scopeLabel: scopeConfig.label,
			regionLabelPlural: scopeConfig.regionLabelPlural,
		};
	});

export const Route = createFileRoute("/leaderboard")({
	validateSearch: (search: Record<string, unknown>): LeaderboardSearch => ({
		n:
			typeof search.n === "string"
				? search.n
				: typeof search.n === "number"
					? `${search.n}`
					: undefined,
		scope: parseCoverageScope(
			typeof search.scope === "string" ? search.scope : undefined,
		),
	}),
	loaderDeps: ({ search }) => ({
		n: search.n,
		scope: search.scope,
	}),
	loader: async ({ deps }) => {
		const normalizedN = parseLeaderboardLimit(deps.n);
		return loadLeaderboardPage({
			data: {
				n: normalizedN,
				scope: deps.scope ?? "us",
			},
		});
	},
	component: LeaderboardPage,
});

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

function LeaderboardPage() {
	const { entries, generatedAt, n, scope, scopeLabel, regionLabelPlural } =
		Route.useLoaderData();
	const navigate = useNavigate();
	const [nInput, setNInput] = useState(`${n}`);
	const [scopeInput, setScopeInput] = useState<CoverageScope>(scope);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const normalizedN = parseLeaderboardLimit(nInput);

		void navigate({
			to: "/leaderboard",
			search: {
				n: `${normalizedN}`,
				scope: scopeInput,
			},
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
					<Stack gap="lg">
						<Group justify="space-between" align="end">
							<Stack gap={4}>
								<Text
									size="xs"
									tt="uppercase"
									fw={700}
									c="var(--kicker)"
								>
									Top N leaderboard
								</Text>
								<Title order={1}>
									Coverage leaderboard for {scopeLabel}.
								</Title>
								<Text maw={760} c="dimmed">
									Ordered by visited{" "}
									{regionLabelPlural.toLowerCase()}{" "}
									descending, then WCA ID ascending to keep
									ties deterministic.
								</Text>
							</Stack>
							<Stack gap={2} align="flex-end">
								<Text size="sm" c="dimmed">
									Weekly export updated{" "}
									{formatTimestamp(generatedAt)} UTC
								</Text>
								<Text size="sm" c="dimmed">
									Showing top {n}
								</Text>
							</Stack>
						</Group>

						<form onSubmit={handleSubmit}>
							<Group align="end" gap="md">
								<NativeSelect
									label="Coverage scope"
									data={COVERAGE_SCOPE_OPTIONS}
									value={scopeInput}
									onChange={(event) =>
										setScopeInput(
											event.currentTarget
												.value as CoverageScope,
										)
									}
									w={{ base: "100%", sm: 220 }}
								/>
								<TextInput
									label="Top N"
									value={nInput}
									onChange={(event) =>
										setNInput(event.currentTarget.value)
									}
									inputMode="numeric"
									pattern="[0-9]*"
									w={140}
								/>
								<Button type="submit" color="teal">
									Apply
								</Button>
							</Group>
						</form>
					</Stack>
				</Paper>

				<Paper className="island-shell" p="md">
					<Table highlightOnHover withTableBorder stickyHeader>
						<thead>
							<tr>
								<th>Rank</th>
								<th>Competitor</th>
								<th>WCA ID</th>
								<th>Country</th>
								<th>Visited regions</th>
								<th>Competitions in scope</th>
							</tr>
						</thead>
						<tbody>
							{entries.map((entry) => (
								<tr key={entry.wcaId}>
									<td>#{entry.rank}</td>
									<td>
										<Link
											to="/competitors/$wcaId"
											params={{ wcaId: entry.wcaId }}
											search={{ scope }}
											className="no-underline"
										>
											<Text fw={700} c="teal.7">
												{entry.name}
											</Text>
										</Link>
									</td>
									<td>{entry.wcaId}</td>
									<td>{entry.countryCode}</td>
									<td>{entry.visitedRegionsCount}</td>
									<td>{entry.totalCompetitions}</td>
								</tr>
							))}
						</tbody>
					</Table>
				</Paper>
			</Stack>
		</Container>
	);
}
