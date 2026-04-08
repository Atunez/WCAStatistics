import { Container, Group, Stack, Text } from "@mantine/core";

export default function Footer() {
	return (
		<footer className="site-footer mt-16 py-10 text-[var(--sea-ink-soft)]">
			<Container size="xl" px="md">
				<Group justify="space-between" align="end" gap="lg">
					<Stack gap="xs" maw={720}>
						<Text
							size="xs"
							tt="uppercase"
							fw={700}
							c="var(--kicker)"
						>
							Public cubing stats
						</Text>
						<Text size="sm" lh={1.7} c="var(--sea-ink-soft)">
							Search any WCA ID to compare region coverage across
							the United States, Canada, and England, review
							recent competition history, and scout upcoming
							competitions in the remaining regions.
						</Text>
					</Stack>
					<Stack gap={2} align="flex-end">
						<Text fw={700} c="var(--sea-ink)">
							WCA Region Coverage
						</Text>
						<Text size="sm" c="var(--sea-ink-soft)">
							Built with TanStack Start and Mantine.
						</Text>
					</Stack>
				</Group>
			</Container>
		</footer>
	);
}
