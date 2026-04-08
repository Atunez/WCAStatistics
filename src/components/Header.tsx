import {
	Badge,
	Box,
	Button,
	Container,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { COVERAGE_SCOPE_OPTIONS } from "#/lib/coverage-scopes";
import ThemeToggle from "./ThemeToggle";

const navItems = [
	{ to: "/", label: "Search" },
	{ to: "/leaderboard", label: "Leaderboard" },
	{ to: "/about", label: "About" },
] as const;

export default function Header() {
	return (
		<Box
			component="header"
			className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)]"
		>
			<Container size="xl" px="md" py="md">
				<Group justify="space-between" align="center" gap="md">
					<Link to="/" className="no-underline">
						<Paper className="island-shell px-4 py-3">
							<Group gap="md" wrap="nowrap">
								<Badge
									size="xl"
									radius="xl"
									variant="filled"
									styles={{
										root: {
											background:
												"linear-gradient(135deg,var(--lagoon),#7ed3bf)",
											color: "#fff",
											paddingInline: 14,
											height: 36,
										},
									}}
								>
									{COVERAGE_SCOPE_OPTIONS.length} scopes
								</Badge>
								<Stack gap={2}>
									<Text
										size="xs"
										tt="uppercase"
										c="dimmed"
										fw={700}
									>
										WCA
									</Text>
									<Title order={4} c="var(--sea-ink)">
										Region Coverage
									</Title>
								</Stack>
							</Group>
						</Paper>
					</Link>

					<Group gap="xs" visibleFrom="sm">
						{navItems.map((item) => (
							<Link
								key={item.to}
								to={item.to}
								className="no-underline"
							>
								<Button variant="subtle" color="gray">
									{item.label}
								</Button>
							</Link>
						))}
						<Button
							component="a"
							href="https://www.worldcubeassociation.org/"
							target="_blank"
							rel="noreferrer"
							variant="subtle"
							color="gray"
						>
							WCA
						</Button>
					</Group>

					<ThemeToggle />
				</Group>

				<Group gap="xs" hiddenFrom="sm" mt="md">
					{navItems.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							className="no-underline"
						>
							<Button size="xs" variant="light" color="teal">
								{item.label}
							</Button>
						</Link>
					))}
				</Group>
			</Container>
		</Box>
	);
}
