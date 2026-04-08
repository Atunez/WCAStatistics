import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env/server";

const databaseUrl = env.DATABASE_DIRECT_URL ?? env.DATABASE_POOLER_URL;

if (!databaseUrl) {
	throw new Error(
		"Database URL is not defined. Please set either DATABASE_POOLER_URL or DATABASE_DIRECT_URL in your environment variables.",
	);
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

export const db = drizzle(client);
