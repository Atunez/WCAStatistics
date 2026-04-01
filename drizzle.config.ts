import 'dotenv/config' 
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './src/db/supabase/migrations',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_DIRECT_URL!,
  },
  verbose: true,
})
