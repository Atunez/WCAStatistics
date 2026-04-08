import { relations } from 'drizzle-orm/relations'
import {
  personUsCompetitions,
  personUsStateSummary,
  usCompetitions,
  wcaPeople,
} from './schema'

export const wcaPeopleRelations = relations(wcaPeople, ({ many, one }) => ({
  usCompetitions: many(personUsCompetitions),
  stateSummary: one(personUsStateSummary, {
    fields: [wcaPeople.wcaId],
    references: [personUsStateSummary.wcaId],
  }),
}))

export const usCompetitionsRelations = relations(usCompetitions, ({ many }) => ({
  participants: many(personUsCompetitions),
}))

export const personUsCompetitionsRelations = relations(
  personUsCompetitions,
  ({ one }) => ({
    person: one(wcaPeople, {
      fields: [personUsCompetitions.wcaId],
      references: [wcaPeople.wcaId],
    }),
    competition: one(usCompetitions, {
      fields: [personUsCompetitions.competitionId],
      references: [usCompetitions.competitionId],
    }),
  }),
)
