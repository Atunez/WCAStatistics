import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
	server: {
		DATABASE_DIRECT_URL: z.url().optional(),
		DATABASE_POOLER_URL: z.url().optional(),
	},
	extends: [],
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
	skipValidation: process.env.BUILD_ENV === "production",
});
