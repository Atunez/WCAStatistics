import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";

import "@mantine/core/styles.css";
import {
	AppShell,
	Button,
	createTheme,
	Group,
	type MantineColorsTuple,
	MantineProvider,
} from "@mantine/core";
import appCss from "../styles.css?url";

const myColor: MantineColorsTuple = [
	"#ffe8e9",
	"#ffd1d1",
	"#fba0a0",
	"#f76d6d",
	"#f44141",
	"#f22625",
	"#f21616",
	"#d8070b",
	"#c10007",
	"#a90003",
];

import { useDisclosure } from "@mantine/hooks";
import type { QueryClient } from "@tanstack/react-query";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "TanStack Start Starter",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const theme = createTheme({
		colors: {
			myColor,
		},
		primaryColor: "myColor",
	});

	const [opened, handlers] = useDisclosure(false);

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
				<TanStackQueryProvider>
					<MantineProvider theme={theme}>
						<AppShell>
							<AppShell.Header>
								<Group>
									Header
									<Group>
										<Button>Region Tracker</Button>
									</Group>
								</Group>
							</AppShell.Header>
							<AppShell.Main>{children}</AppShell.Main>
						</AppShell>

						<TanStackDevtools
							config={{
								position: "bottom-right",
							}}
							plugins={[
								{
									name: "Tanstack Router",
									render: <TanStackRouterDevtoolsPanel />,
								},
								TanStackQueryDevtools,
							]}
						/>
					</MantineProvider>
				</TanStackQueryProvider>
				<Scripts />
			</body>
		</html>
	);
}
