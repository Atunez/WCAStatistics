import { Container, Group, Stack, Text } from "@mantine/core";

export default function Footer() {
	return (
		<footer className="site-footer">
			<Container size="xl" px="md" py="xl">
				<Stack gap="sm">
					<Text className="eyebrow">WCA region coverage</Text>
					<Text size="sm" lh={1.7} c="var(--text-soft)" maw={780}>
						Search a WCA ID to compare visited and remaining
						regions, review recent competition history, and inspect
						upcoming opportunities in the current catalog.
					</Text>
					<Group gap="xl" wrap="wrap">
						<Text size="sm" c="var(--text-soft)">
							Scopes: United States, Canada, England
						</Text>
						<Text size="sm" c="var(--text-soft)">
							Built with TanStack Start and Mantine
						</Text>
					</Group>
				</Stack>
			</Container>
		</footer>
	);
}
