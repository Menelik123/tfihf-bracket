import type { Match, Knockout, KnockoutMatch } from './types';

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
    h.played++; a.played++;
    h.pf += f.homeScore; h.pa += f.awayScore;
    a.pf += f.awayScore; a.pa += f.homeScore;
    if (f.homeScore > f.awayScore) { h.won++; h.pts += 3; a.lost++; }
    else if (f.awayScore > f.homeScore) { a.won++; a.pts += 3; h.lost++; }
  }
  for (const s of Object.values(map)) s.pd = s.pf - s.pa;
  return Object.values(map).sort((a, b) =>
    b.pts !== a.pts ? b.pts - a.pts :
    b.pd !== a.pd ? b.pd - a.pd :
    b.pf - a.pf
  );
}

function winner(m: KnockoutMatch): string {
  if (m.status !== 'final' || m.homeScore === null || m.awayScore === null) return '';
  return m.homeScore >= m.awayScore ? m.home : m.away;
}

function loser(m: KnockoutMatch): string {
  if (m.status !== 'final' || m.homeScore === null || m.awayScore === null) return '';
  return m.homeScore >= m.awayScore ? m.away : m.home;
}

// After scoring a QF/SF, auto-advance winner into next round and loser into 3rd place.
// Slots remain manually editable — only fills if blank.
export function advanceBracket(ko: Knockout): Knockout {
  const k = structuredClone(ko);

  if (k.hasQF) {
    const w1 = winner(k.qf1); if (w1 && !k.sf1.home) k.sf1.home = w1;
    const w2 = winner(k.qf2); if (w2 && !k.sf1.away) k.sf1.away = w2;
    const w3 = winner(k.qf3); if (w3 && !k.sf2.home) k.sf2.home = w3;
    const w4 = winner(k.qf4); if (w4 && !k.sf2.away) k.sf2.away = w4;
  }

  // SF winners → Final; SF losers → 3rd Place
  const ws1 = winner(k.sf1); if (ws1 && !k.final.home) k.final.home = ws1;
  const ws2 = winner(k.sf2); if (ws2 && !k.final.away) k.final.away = ws2;
  const ls1 = loser(k.sf1);  if (ls1 && !k.third.home) k.third.home = ls1;
  const ls2 = loser(k.sf2);  if (ls2 && !k.third.away) k.third.away = ls2;

  return k;
}

export function bracketChampion(ko: Knockout): string {
  return winner(ko.final);
}
