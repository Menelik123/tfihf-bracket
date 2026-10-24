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
  home: string | null;
  away: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
}

export interface Knockout {
  sf1: KnockoutMatch; // A1 vs B2
  sf2: KnockoutMatch; // B1 vs A2
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
