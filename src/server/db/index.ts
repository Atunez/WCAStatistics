import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env/server";

type Database = ReturnType<typeof drizzle>;

const DATABASE_ERROR_MESSAGE =
	"Database URL is not defined. Please set either DATABASE_POOLER_URL or DATABASE_DIRECT_URL in your environment variables.";

let database: Database | null = null;

function getDatabaseUrl() {
	// Prefer the pooled connection in the app runtime; fall back to the direct
	// URL so existing local setups still work.
	return env.DATABASE_POOLER_URL ?? env.DATABASE_DIRECT_URL;
}

export function getDb() {
	if (database) {
		return database;
	}

	const databaseUrl = getDatabaseUrl();

	if (!databaseUrl) {
		throw new Error(DATABASE_ERROR_MESSAGE);
	}

	const client = postgres(databaseUrl, {
		prepare: false,
		connect_timeout: 10,
		idle_timeout: 20,
		max_lifetime: 60 * 30,
		max: 1,
		fetch_types: false,
		ssl: "require",
	});

	database = drizzle(client);
	return database;
}
