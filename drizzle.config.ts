import 'dotenv/config' 
import { defineConfig } from 'drizzle-kit'

console.log('Env vars in drizzle.config.ts:', process.env)

export default defineConfig({
  out: './src/server/db/supabase/migrations',
  schema: './src/server/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_POOLER_URL ?? process.env.DATABASE_DIRECT_URL!,
  },
  verbose: true,
})
