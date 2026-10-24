import type { Match, Group, Division, Knockout, KnockoutMatch } from './types';

export interface TeamStanding {
  team: string;
  played: number;
  won: number;
  lost: number;
  pf: number;
  pa: number;
  pd: number;
  pts: number;
}

export function computeStandings(teams: string[], fixtures: Match[]): TeamStanding[] {
  const map: Record<string, TeamStanding> = {};
  for (const t of teams) {
    map[t] = { team: t, played: 0, won: 0, lost: 0, pf: 0, pa: 0, pd: 0, pts: 0 };
  }
  for (const f of fixtures) {
    if (f.status !== 'final' || f.homeScore === null || f.awayScore === null) continue;
    const h = map[f.home];
    const a = map[f.away];
    if (!h || !a) continue;
    h.played++;
    a.played++;
    h.pf += f.homeScore;
    h.pa += f.awayScore;
    a.pf += f.awayScore;
    a.pa += f.homeScore;
    if (f.homeScore > f.awayScore) {
      h.won++;
      h.pts += 3;
      a.lost++;
    } else if (f.awayScore > f.homeScore) {
      a.won++;
      a.pts += 3;
      h.lost++;
    }
  }
  for (const s of Object.values(map)) s.pd = s.pf - s.pa;
  return Object.values(map).sort((a, b) =>
    b.pts !== a.pts ? b.pts - a.pts :
    b.pd !== a.pd ? b.pd - a.pd :
    b.pf - a.pf
  );
}

function groupComplete(group: Group): boolean {
  return group.fixtures.every(f => f.status === 'final');
}

function sfWinner(sf: KnockoutMatch): string | null {
  if (sf.status !== 'final' || sf.homeScore === null || sf.awayScore === null) return null;
  return sf.homeScore > sf.awayScore ? sf.home : sf.away;
}

export function resolveKnockout(division: Division): Knockout {
  const ko = structuredClone(division.knockout);
  const aComplete = groupComplete(division.groupA);
  const bComplete = groupComplete(division.groupB);

  if (aComplete && bComplete) {
    const sA = computeStandings(division.groupA.teams, division.groupA.fixtures);
    const sB = computeStandings(division.groupB.teams, division.groupB.fixtures);
    const newHome1 = sA[0]?.team ?? null;
    const newAway1 = sB[1]?.team ?? null;
    const newHome2 = sB[0]?.team ?? null;
    const newAway2 = sA[1]?.team ?? null;

    // Reset SF scores if teams changed
    if (ko.sf1.home !== newHome1 || ko.sf1.away !== newAway1) {
      ko.sf1 = { ...ko.sf1, home: newHome1, away: newAway1, homeScore: null, awayScore: null, status: 'pending' };
    }
    if (ko.sf2.home !== newHome2 || ko.sf2.away !== newAway2) {
      ko.sf2 = { ...ko.sf2, home: newHome2, away: newAway2, homeScore: null, awayScore: null, status: 'pending' };
    }
  } else {
    ko.sf1 = { ...ko.sf1, home: null, away: null, homeScore: null, awayScore: null, status: 'pending' };
    ko.sf2 = { ...ko.sf2, home: null, away: null, homeScore: null, awayScore: null, status: 'pending' };
    ko.final = { ...ko.final, home: null, away: null, homeScore: null, awayScore: null, status: 'pending' };
    return ko;
  }

  const w1 = sfWinner(ko.sf1);
  const w2 = sfWinner(ko.sf2);
  if (w1 && w2) {
    if (ko.final.home !== w1 || ko.final.away !== w2) {
      ko.final = { ...ko.final, home: w1, away: w2, homeScore: null, awayScore: null, status: 'pending' };
    }
  } else {
    ko.final = { ...ko.final, home: w1, away: w2, homeScore: null, awayScore: null, status: 'pending' };
  }

  return ko;
}

export function finalWinner(ko: Knockout): string | null {
  return sfWinner(ko.final);
}
