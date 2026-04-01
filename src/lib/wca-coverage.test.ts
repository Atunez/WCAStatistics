import { describe, expect, it } from "vitest";
import {
  buildCompetitionCatalog,
  buildCompetitorCoverageView,
  rankLeaderboard,
} from "./wca-coverage";
import type { WcaCompetition, WcaPerson } from "./wca-types";

const competitions: WcaCompetition[] = [
  {
    id: "TexasOpen2024",
    name: "Texas Open 2024",
    city: "Houston, Texas",
    country: "US",
    date: { from: "2024-04-14", till: "2024-04-14", numberOfDays: 1 },
    isCanceled: false,
    venue: { address: "123 Main St, Houston, TX 77001" },
  },
  {
    id: "TexasChampionship2023",
    name: "Texas Championship 2023",
    city: "Dallas, Texas",
    country: "US",
    date: { from: "2023-08-12", till: "2023-08-13", numberOfDays: 2 },
    isCanceled: false,
    venue: { address: "500 Center St, Dallas, TX 75001" },
  },
  {
    id: "TexasClassic2022",
    name: "Texas Classic 2022",
    city: "Austin, Texas",
    country: "US",
    date: { from: "2022-04-10", till: "2022-04-10", numberOfDays: 1 },
    isCanceled: false,
    venue: { address: "1 Austin Ave, Austin, TX 73301" },
  },
  {
    id: "NevadaFuture2026",
    name: "Nevada Future 2026",
    city: "Reno, Nevada",
    country: "US",
    date: { from: "2026-06-01", till: "2026-06-01", numberOfDays: 1 },
    isCanceled: false,
    venue: { address: "1 Desert Rd, Reno, NV 89501" },
  },
  {
    id: "CaliforniaPast2021",
    name: "California Past 2021",
    city: "San Diego, California",
    country: "US",
    date: { from: "2021-03-05", till: "2021-03-05", numberOfDays: 1 },
    isCanceled: false,
    venue: { address: "1 Coast Rd, San Diego, CA 92101" },
  },
];

const people: WcaPerson[] = [
  {
    id: "2010BETA01",
    name: "Beta",
    country: "US",
    numberOfCompetitions: 3,
    competitionIds: ["TexasOpen2024", "NevadaFuture2026", "CaliforniaPast2021"],
  },
  {
    id: "2010ALFA01",
    name: "Alpha",
    country: "US",
    numberOfCompetitions: 2,
    competitionIds: ["TexasOpen2024", "NevadaFuture2026"],
  },
  {
    id: "2010GAMM01",
    name: "Gamma",
    country: "CA",
    numberOfCompetitions: 1,
    competitionIds: ["TexasOpen2024"],
  },
];

describe("wca coverage helpers", () => {
  it("keeps the last 3 historical competitions and upcoming competitions per state", () => {
    const catalog = buildCompetitionCatalog(
      competitions,
      "2025-01-01",
      "2025-01-02T00:00:00.000Z",
    );
    const coverage = buildCompetitorCoverageView(people[0], catalog);
    const texas = coverage.visitedStates.find((state) => state.stateCode === "TX");
    const nevada = coverage.visitedStates.find((state) => state.stateCode === "NV");

    expect(texas?.recentCompetitions.map((competition) => competition.id)).toEqual([
      "TexasOpen2024",
      "TexasChampionship2023",
      "TexasClassic2022",
    ]);
    expect(nevada?.upcomingCompetitions.map((competition) => competition.id)).toEqual([
      "NevadaFuture2026",
    ]);
  });

  it("partitions visited and unvisited states from official competition participation", () => {
    const catalog = buildCompetitionCatalog(competitions, "2025-01-01");
    const coverage = buildCompetitorCoverageView(people[1], catalog);

    expect(coverage.visitedStatesCount).toBe(2);
    expect(coverage.visitedStates.map((state) => state.stateCode)).toEqual(["NV", "TX"]);
    expect(coverage.unvisitedStates.some((state) => state.stateCode === "CA")).toBe(true);
  });

  it("orders the leaderboard by visited states descending and WCA ID ascending", () => {
    const catalog = buildCompetitionCatalog(competitions, "2025-01-01");
    const leaderboard = rankLeaderboard(people, catalog, 3);

    expect(leaderboard.map((entry) => [entry.rank, entry.wcaId, entry.visitedStatesCount])).toEqual([
      [1, "2010BETA01", 3],
      [2, "2010ALFA01", 2],
      [3, "2010GAMM01", 1],
    ]);
  });
});
