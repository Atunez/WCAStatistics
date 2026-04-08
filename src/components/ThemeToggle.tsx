import { SegmentedControl, Tooltip } from "@mantine/core";
import { useAppTheme } from "./AppThemeProvider";

export default function ThemeToggle() {
	const { mode, setMode } = useAppTheme();

	return (
		<Tooltip label="Switch between light, dark, and system theme modes.">
			<SegmentedControl
				size="xs"
				value={mode}
				onChange={(value) => {
					if (value === "light" || value === "dark" || value === "auto") {
						setMode(value);
					}
				}}
				data={[
					{ label: "Light", value: "light" },
					{ label: "Dark", value: "dark" },
					{ label: "Auto", value: "auto" },
				]}
			/>
		</Tooltip>
	);
}
