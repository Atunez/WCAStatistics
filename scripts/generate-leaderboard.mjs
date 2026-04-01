import { writeFile } from 'node:fs/promises';

const RAW_BASE =
  'https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/master/api';
const US_COMPETITIONS_URL = `${RAW_BASE}/competitions/US.json`;
const FIRST_PERSON_PAGE_URL = `${RAW_BASE}/persons.json`;
const PERSON_PAGE_URL = (page) =>
  page === 1 ? FIRST_PERSON_PAGE_URL : `${RAW_BASE}/persons-page-${page}.json`;

const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'],
  ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'],
  ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
  ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
  ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
  ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];

const stateMap = new Map([
  ...US_STATES.map(([code, name]) => [code, { code, name }]),
  ...US_STATES.map(([code, name]) => [name.toLowerCase(), { code, name }]),
]);

function normalizeState(token) {
  if (!token) return null;
  const cleaned = token.replace(/\./g, '').replace(/\s+/g, ' ').trim();
  return stateMap.get(cleaned.toUpperCase()) ?? stateMap.get(cleaned.toLowerCase()) ?? null;
}

function extractState(competition) {
  const tokens = [competition.city, competition.venue?.address]
    .filter(Boolean)
    .flatMap((value) => `${value}`.split(','))
    .reverse();

  for (const token of tokens) {
    const match = normalizeState(token);
    if (match) return match;
  }

  const address = competition.venue?.address ?? '';
  const abbreviation = address.match(/\b([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/);
  return normalizeState(abbreviation?.[1] ?? null);
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return response.json();
}

function mapLimit(items, limit, mapper) {
  return new Promise((resolve, reject) => {
    const results = new Array(items.length);
    let nextIndex = 0;
    let active = 0;
    let completed = 0;

    const schedule = () => {
      if (completed === items.length) {
        resolve(results);
        return;
      }

      while (active < limit && nextIndex < items.length) {
        const currentIndex = nextIndex++;
        active += 1;
        Promise.resolve(mapper(items[currentIndex], currentIndex))
          .then((result) => {
            results[currentIndex] = result;
            active -= 1;
            completed += 1;
            schedule();
          })
          .catch(reject);
      }
    };

    schedule();
  });
}

const competitionsPayload = await fetchJson(US_COMPETITIONS_URL);
const competitionStateById = new Map(
  competitionsPayload.items
    .filter((competition) => competition.country === 'US' && !competition.isCanceled)
    .map((competition) => [competition.id, extractState(competition)?.code ?? null])
    .filter((entry) => Boolean(entry[1])),
);

const firstPage = await fetchJson(FIRST_PERSON_PAGE_URL);
const totalPages = Math.ceil(firstPage.total / firstPage.pagination.size);
const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
const allPeople = [firstPage.items];
const remainingPages = await mapLimit(pages.slice(1), 10, async (page) => {
  const payload = await fetchJson(PERSON_PAGE_URL(page));
  return payload.items;
});
allPeople.push(...remainingPages);

const leaderboard = allPeople
  .flat()
  .map((person) => {
    const visitedStates = new Set(
      person.competitionIds
        .map((competitionId) => competitionStateById.get(competitionId))
        .filter(Boolean),
    );

    return {
      wcaId: person.id,
      name: person.name,
      countryCode: person.country,
      totalCompetitions: person.numberOfCompetitions,
      visitedStatesCount: visitedStates.size,
    };
  })
  .filter((entry) => entry.visitedStatesCount > 0)
  .sort(
    (a, b) =>
      b.visitedStatesCount - a.visitedStatesCount || a.wcaId.localeCompare(b.wcaId),
  )
  .slice(0, 100)
  .map((entry, index) => ({ rank: index + 1, ...entry }));

const fileContents = `import type { LeaderboardEntry } from "#/lib/wca-types";

export const leaderboardGeneratedAt = ${JSON.stringify(new Date().toISOString())};

export const leaderboardSnapshot: LeaderboardEntry[] = ${JSON.stringify(leaderboard, null, 2)};
`;

await writeFile(new URL('../src/data/leaderboard-snapshot.ts', import.meta.url), fileContents);
console.log(`Generated ${leaderboard.length} leaderboard entries across ${totalPages} pages.`);
