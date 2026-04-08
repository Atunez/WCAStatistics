import {
	Button,
	MantineProvider,
	Paper,
	SegmentedControl,
	createTheme,
} from "@mantine/core";
import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";

type ThemeMode = "light" | "dark" | "auto";
type ResolvedThemeMode = "light" | "dark";

type AppThemeContextValue = {
	mode: ThemeMode;
	resolvedMode: ResolvedThemeMode;
	setMode: (mode: ThemeMode) => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

const theme = createTheme({
	fontFamily: "var(--font-sans)",
	headings: {
		fontFamily: '"Fraunces", Georgia, serif',
		fontWeight: "700",
	},
	primaryColor: "teal",
	defaultRadius: "xl",
	components: {
		Paper: Paper.extend({
			defaultProps: {
				radius: "xl",
				withBorder: true,
			},
		}),
		Button: Button.extend({
			defaultProps: {
				radius: "xl",
			},
		}),
		SegmentedControl: SegmentedControl.extend({
			defaultProps: {
				radius: "xl",
			},
		}),
	},
});

function getInitialMode(): ThemeMode {
	if (typeof window === "undefined") {
		return "auto";
	}

	const stored = window.localStorage.getItem("theme");
	if (stored === "light" || stored === "dark" || stored === "auto") {
		return stored;
	}

	return "auto";
}

function resolveThemeMode(mode: ThemeMode): ResolvedThemeMode {
	if (typeof window === "undefined") {
		return "light";
	}

	if (mode !== "auto") {
		return mode;
	}

	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function applyThemeMode(mode: ThemeMode) {
	if (typeof window === "undefined") {
		return "light" as const;
	}

	const resolved = resolveThemeMode(mode);
	document.documentElement.classList.remove("light", "dark");
	document.documentElement.classList.add(resolved);

	if (mode === "auto") {
		document.documentElement.removeAttribute("data-theme");
	} else {
		document.documentElement.setAttribute("data-theme", mode);
	}

	document.documentElement.style.colorScheme = resolved;
	return resolved;
}

export function useAppTheme() {
	const value = useContext(AppThemeContext);
	if (!value) {
		throw new Error("useAppTheme must be used within AppThemeProvider.");
	}

	return value;
}

export default function AppThemeProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [mode, setMode] = useState<ThemeMode>("auto");
	const [resolvedMode, setResolvedMode] = useState<ResolvedThemeMode>("light");

	useEffect(() => {
		const initialMode = getInitialMode();
		setMode(initialMode);
		setResolvedMode(applyThemeMode(initialMode));
	}, []);

	useEffect(() => {
		const resolved = applyThemeMode(mode);
		setResolvedMode(resolved);
		window.localStorage.setItem("theme", mode);

		if (mode !== "auto") {
			return;
		}

		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => {
			setResolvedMode(applyThemeMode("auto"));
		};

		media.addEventListener("change", onChange);
		return () => {
			media.removeEventListener("change", onChange);
		};
	}, [mode]);

	return (
		<AppThemeContext.Provider value={{ mode, resolvedMode, setMode }}>
			<MantineProvider
				theme={theme}
				forceColorScheme={resolvedMode}
				defaultColorScheme="auto"
			>
				{children}
			</MantineProvider>
		</AppThemeContext.Provider>
	);
}
