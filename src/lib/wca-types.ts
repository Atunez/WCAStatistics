export type WcaCompetition = {
  id: string;
  name: string;
  city: string;
  country: string;
  date: {
    from: string;
    till: string;
    numberOfDays: number;
  };
  isCanceled: boolean;
  venue?: {
    address?: string;
  };
};

export type WcaPerson = {
  id: string;
  name: string;
  country: string;
  numberOfCompetitions: number;
  competitionIds: string[];
};

export type CompetitionSummary = {
  id: string;
  name: string;
  city: string;
  stateCode: string;
  stateName: string;
  startDate: string;
  endDate: string;
  wcaUrl: string;
};

export type StateCoverage = {
  stateCode: string;
  stateName: string;
  recentCompetitions: CompetitionSummary[];
  upcomingCompetitions: CompetitionSummary[];
};

export type CompetitorCoverageView = {
  competitor: {
    wcaId: string;
    name: string;
    countryCode: string;
    totalCompetitions: number;
  };
  visitedStatesCount: number;
  visitedStates: StateCoverage[];
  unvisitedStates: StateCoverage[];
  sourceUpdatedAt: string;
};

export type LeaderboardEntry = {
  rank: number;
  wcaId: string;
  name: string;
  countryCode: string;
  visitedStatesCount: number;
  totalCompetitions: number;
};
