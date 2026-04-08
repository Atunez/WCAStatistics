import {
	Container,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
	component: About,
});

function About() {
	return (
		<Container size="xl" px="md" py="xl">
			<Stack gap="xl">
				<Paper
					className="island-shell"
					radius="32px"
					p={{ base: "xl", sm: "3rem" }}
				>
					<Stack gap="md">
						<Text
							size="xs"
							tt="uppercase"
							fw={700}
							c="var(--kicker)"
						>
							About the project
						</Text>
						<Title order={1}>
							A public tracker for multi-country region coverage.
						</Title>
						<Text size="lg" c="dimmed" maw={760}>
							This site tracks official WCA competition coverage
							across three scopes: the United States, Canada, and
							England. Enter a WCA ID to see visited versus
							unvisited regions, recent competitions in each
							region, and a simple look at upcoming competitions
							where coverage is still missing.
						</Text>
					</Stack>
				</Paper>

				<SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md">
					{[
						[
							"Historical coverage",
							"Visited regions are derived from official WCA competition participation and currently cover 55 U.S. regions, 13 Canadian regions, and 48 English ceremonial counties.",
						],
						[
							"Upcoming competitions",
							"Future competitions are informational only. If the source is unavailable, the historical coverage view still renders.",
						],
						[
							"Public leaderboard",
							"The leaderboard is fixed to the top 100 competitors within the selected scope, ordered deterministically by visited-region count and then WCA ID.",
						],
					].map(([title, description]) => (
						<Paper key={title} className="island-shell" p="lg">
							<Stack gap="xs">
								<Title order={3}>{title}</Title>
								<Text size="sm" c="dimmed" lh={1.7}>
									{description}
								</Text>
							</Stack>
						</Paper>
					))}
				</SimpleGrid>
			</Stack>
		</Container>
	);
}
