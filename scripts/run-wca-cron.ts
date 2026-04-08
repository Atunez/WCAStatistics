import "dotenv/config";
import { spawn } from "node:child_process";
import process from "node:process";

const DEFAULT_CRON = "0 6 * * 1"; // Monday 06:00 UTC
const DEFAULT_POLL_MS = 30_000;

type CronSpec = {
	minute: number;
	hour: number;
	dayOfWeek: number;
};

function parseArgs(argv: string[]) {
	return {
		once: argv.includes("--once"),
		runNow: argv.includes("--run-now"),
	};
}

function parseWeeklyCron(raw: string): CronSpec {
	const parts = raw.trim().split(/\s+/);
	if (parts.length !== 5) {
		throw new Error(
			`Unsupported cron format "${raw}". Expected "m h * * d" (UTC).`,
		);
	}

	const [minuteRaw, hourRaw, dayOfMonth, month, dayOfWeekRaw] = parts;
	if (dayOfMonth !== "*" || month !== "*") {
		throw new Error(
			`Unsupported cron format "${raw}". Only "m h * * d" is supported.`,
		);
	}

	const minute = Number.parseInt(minuteRaw, 10);
	const hour = Number.parseInt(hourRaw, 10);
	const dayOfWeek = Number.parseInt(dayOfWeekRaw, 10);

	if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
		throw new Error(`Invalid cron minute "${minuteRaw}".`);
	}
	if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
		throw new Error(`Invalid cron hour "${hourRaw}".`);
	}
	if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
		throw new Error(`Invalid cron day-of-week "${dayOfWeekRaw}".`);
	}

	return { minute, hour, dayOfWeek };
}

function toMinuteKey(now: Date) {
	return `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`;
}

function matchesSchedule(now: Date, spec: CronSpec) {
	return (
		now.getUTCMinutes() === spec.minute &&
		now.getUTCHours() === spec.hour &&
		now.getUTCDay() === spec.dayOfWeek
	);
}

function runIngestion() {
	return new Promise<number>((resolve, reject) => {
		const child =
			process.platform === "win32"
				? spawn("cmd.exe", ["/d", "/s", "/c", "pnpm ingest:wca-weekly"], {
						stdio: "inherit",
						env: process.env,
					})
				: spawn("pnpm", ["ingest:wca-weekly"], {
						stdio: "inherit",
						env: process.env,
					});

		child.on("error", reject);
		child.on("exit", (code) => {
			resolve(code ?? 1);
		});
	});
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const spec = parseWeeklyCron(process.env.WCA_CRON ?? DEFAULT_CRON);
	const pollMsRaw = process.env.WCA_CRON_POLL_MS ?? `${DEFAULT_POLL_MS}`;
	const pollMs = Number.parseInt(pollMsRaw, 10);

	if (!Number.isInteger(pollMs) || pollMs < 1_000) {
		throw new Error(
			`Invalid WCA_CRON_POLL_MS "${pollMsRaw}". Use an integer >= 1000.`,
		);
	}

	if (args.once) {
		const exitCode = await runIngestion();
		process.exitCode = exitCode;
		return;
	}

	console.log(
		`[cron] Scheduler started. Pattern=${spec.minute} ${spec.hour} * * ${spec.dayOfWeek} (UTC), poll=${pollMs}ms`,
	);

	let running = false;
	let lastMinuteKey: string | null = null;

	const tick = async () => {
		const now = new Date();
		if (!matchesSchedule(now, spec)) {
			return;
		}

		const currentMinuteKey = toMinuteKey(now);
		if (lastMinuteKey === currentMinuteKey) {
			return;
		}
		lastMinuteKey = currentMinuteKey;

		if (running) {
			console.warn("[cron] Ingestion already running; skipping this trigger.");
			return;
		}

		running = true;
		console.log(`[cron] Triggering ingestion at ${now.toISOString()}`);
		try {
			const exitCode = await runIngestion();
			if (exitCode !== 0) {
				console.error(`[cron] Ingestion failed with exit code ${exitCode}.`);
			}
		} finally {
			running = false;
		}
	};

	if (args.runNow) {
		await tick();
	}

	const timer = setInterval(() => {
		void tick();
	}, pollMs);

	const shutdown = () => {
		clearInterval(timer);
		process.exit(0);
	};

	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
}

void main().catch((error) => {
	console.error(error);
	process.exit(1);
});
