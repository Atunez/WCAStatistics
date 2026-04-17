import { Box, Container, Group, Stack, Text, Title } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import ThemeToggle from "./ThemeToggle";

const navItems = [
	{ to: "/", label: "Search" },
	{ to: "/leaderboard", label: "Leaderboard" },
	{ to: "/about", label: "About" },
] as const;

export default function Header() {
	return (
		<Box component="header" className="site-header">
			<Container size="xl" px="md" py="md">
				<div className="header-layout">
					<Stack gap={2}>
						<Link to="/" className="brand-link">
							<Text className="eyebrow">WCA statistics</Text>
							<Title order={3}>Region Coverage</Title>
						</Link>
						<Text size="sm" c="var(--text-soft)">
							Track region coverage across the United States,
							Canada, and England.
						</Text>
					</Stack>

					<nav className="header-nav" aria-label="Primary">
						{navItems.map((item) => (
							<Link
								key={item.to}
								to={item.to}
								className="nav-link"
							>
								{item.label}
							</Link>
						))}
						<a
							href="https://www.worldcubeassociation.org/"
							target="_blank"
							rel="noreferrer"
							className="nav-link"
						>
							WCA
						</a>
					</nav>

					<Group justify="flex-end">
						<ThemeToggle />
					</Group>
				</div>
			</Container>
		</Box>
	);
}
