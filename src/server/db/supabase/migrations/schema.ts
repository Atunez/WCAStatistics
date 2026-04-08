import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const wcaExportRunStatus = pgEnum('wca_export_run_status', [
  'started',
  'succeeded',
  'failed',
  'skipped',
])

export const wcaExportRuns = pgTable(
  'wca_export_runs',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    exportDate: timestamp('export_date', { withTimezone: true }).notNull(),
    exportFormatVersion: text('export_format_version').notNull(),
    tsvUrl: text('tsv_url').notNull(),
    status: wcaExportRunStatus('status').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    error: text('error'),
    peopleCount: integer('people_count').notNull().default(0),
    competitionsCount: integer('competitions_count').notNull().default(0),
    personCompetitionPairsCount: integer('person_competition_pairs_count')
      .notNull()
      .default(0),
    statesMappedCount: integer('states_mapped_count').notNull().default(0),
    skippedReason: text('skipped_reason'),
  },
  (table) => [
    uniqueIndex('wca_export_runs_export_date_unique').on(table.exportDate),
    index('wca_export_runs_status_started_idx').on(table.status, table.startedAt),
  ],
)

export const wcaPeople = pgTable('wca_people', {
  wcaId: text('wca_id').primaryKey(),
  name: text('name').notNull(),
  countryId: text('country_id').notNull(),
})

export const usCompetitions = pgTable('us_competitions', {
  competitionId: text('competition_id').primaryKey(),
  name: text('name').notNull(),
  cityName: text('city_name').notNull(),
  venueAddress: text('venue_address'),
  stateCode: text('state_code').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  cancelled: boolean('cancelled').notNull().default(false),
})

export const personUsCompetitions = pgTable(
  'person_us_competitions',
  {
    wcaId: text('wca_id')
      .notNull()
      .references(() => wcaPeople.wcaId, { onDelete: 'cascade' }),
    competitionId: text('competition_id')
      .notNull()
      .references(() => usCompetitions.competitionId, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.wcaId, table.competitionId] }),
    index('person_us_competitions_wca_id_idx').on(table.wcaId),
  ],
)

export const personUsStateSummary = pgTable(
  'person_us_state_summary',
  {
    wcaId: text('wca_id')
      .primaryKey()
      .references(() => wcaPeople.wcaId, { onDelete: 'cascade' }),
    visitedStatesCount: integer('visited_states_count').notNull(),
    usCompetitionsCount: integer('us_competitions_count').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('person_us_state_summary_rank_idx').on(
      table.visitedStatesCount,
      table.wcaId,
    ),
  ],
)
