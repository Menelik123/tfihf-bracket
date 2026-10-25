export type MatchStatus = 'pending' | 'final';
export type DivisionKey = 'boys' | 'girls';

export interface Match {
  id: string;
  round: number;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
}

export interface Group {
  teams: string[];
  fixtures: Match[];
}

export interface KnockoutMatch {
  id: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
}

export interface Knockout {
  hasQF: boolean; // 8-team (QF→SF→F) vs 4-team (SF→F)
  qf1: KnockoutMatch;
  qf2: KnockoutMatch;
  qf3: KnockoutMatch;
  qf4: KnockoutMatch;
  sf1: KnockoutMatch;
  sf2: KnockoutMatch;
  final: KnockoutMatch;
}

export interface Division {
  groupA: Group;
  groupB: Group;
  knockout: Knockout;
}

export interface TournamentState {
  title: string;
  girls: Division;
  boys: Division;
}
