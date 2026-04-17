import { Container, Stack, Table, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

const projectNotes = [
	{
		area: "Historical coverage",
		description:
			"Visited regions are derived from official WCA competition participation and currently cover 55 U.S. regions, 13 Canadian regions, and 48 English ceremonial counties.",
	},
	{
		area: "Upcoming competitions",
		description:
			"Future competitions are informational only. If that source is unavailable, the historical coverage view still renders.",
	},
	{
		area: "Public leaderboard",
		description:
			"The leaderboard is limited to the top 100 competitors in the selected scope and is ordered deterministically by visited-region count and WCA ID.",
	},
];

export const Route = createFileRoute("/about")({
	component: About,
});

function About() {
	return (
		<Container size="xl" px="md" py="xl">
			<Stack gap="xl">
				<section className="page-section page-section--muted">
					<Stack gap="md">
						<Text className="eyebrow">About the project</Text>
						<Title order={1}>
							A public tracker for multi-country region coverage
						</Title>
						<Text size="lg" c="var(--text-soft)" maw={800}>
							This site tracks official WCA competition coverage
							across three scopes: the United States, Canada, and
							England. Enter a WCA ID to see visited versus
							remaining regions, recent competitions in each
							region, and a basic view of upcoming opportunities.
						</Text>
					</Stack>
				</section>

				<section className="page-section">
					<Stack gap="lg">
						<Stack gap={4}>
							<Text className="eyebrow">Data notes</Text>
							<Title order={2}>What the site includes</Title>
						</Stack>

						<Table withTableBorder>
							<thead>
								<tr>
									<th>Area</th>
									<th>Details</th>
								</tr>
							</thead>
							<tbody>
								{projectNotes.map((note) => (
									<tr key={note.area}>
										<td>{note.area}</td>
										<td>{note.description}</td>
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
