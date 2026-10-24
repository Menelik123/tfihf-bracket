import type { TournamentState, Match } from './types';

export const TOURNAMENT_TITLE = 'TFIHF TOURNAMENT';

function m(id: string, round: number, home: string, away: string): Match {
  return { id, round, home, away, homeScore: null, awayScore: null, status: 'pending' };
}

export function buildSeedState(): TournamentState {
  return {
    title: TOURNAMENT_TITLE,
    girls: {
      groupA: {
        teams: ['BBTV 1', 'TEAM TONY', 'ARCHERS', 'ENITONIA'],
        fixtures: [
          // Round 1 (fixed)
          m('ga_r1_1', 1, 'BBTV 1', 'TEAM TONY'),
          m('ga_r1_2', 1, 'ARCHERS', 'ENITONIA'),
          // Round 2
          m('ga_r2_1', 2, 'BBTV 1', 'ARCHERS'),
          m('ga_r2_2', 2, 'TEAM TONY', 'ENITONIA'),
          // Round 3
          m('ga_r3_1', 3, 'BBTV 1', 'ENITONIA'),
          m('ga_r3_2', 3, 'TEAM TONY', 'ARCHERS'),
        ],
      },
      groupB: {
        teams: ['BBTV 2', 'REBELS', 'KASA', 'SWAGGER'],
        fixtures: [
          // Round 1 (fixed)
          m('gb_r1_1', 1, 'BBTV 2', 'REBELS'),
          m('gb_r1_2', 1, 'KASA', 'SWAGGER'),
          // Round 2
          m('gb_r2_1', 2, 'BBTV 2', 'KASA'),
          m('gb_r2_2', 2, 'REBELS', 'SWAGGER'),
          // Round 3
          m('gb_r3_1', 3, 'BBTV 2', 'SWAGGER'),
          m('gb_r3_2', 3, 'REBELS', 'KASA'),
        ],
      },
      knockout: {
        sf1: { id: 'g_sf1', home: null, away: null, homeScore: null, awayScore: null, status: 'pending' },
        sf2: { id: 'g_sf2', home: null, away: null, homeScore: null, awayScore: null, status: 'pending' },
        final: { id: 'g_final', home: null, away: null, homeScore: null, awayScore: null, status: 'pending' },
      },
    },
    boys: {
      groupA: {
        teams: ['BBTV 1', 'TEAM ARCHERS', 'ENITONIA', 'SWAGGER', 'SKYHAWKS', 'DA-F'],
        fixtures: [
          // Round 1 (fixed)
          m('ba_r1_1', 1, 'BBTV 1', 'TEAM ARCHERS'),
          m('ba_r1_2', 1, 'ENITONIA', 'SWAGGER'),
          m('ba_r1_3', 1, 'SKYHAWKS', 'DA-F'),
          // Round 2
          m('ba_r2_1', 2, 'BBTV 1', 'SWAGGER'),
          m('ba_r2_2', 2, 'TEAM ARCHERS', 'SKYHAWKS'),
          m('ba_r2_3', 2, 'ENITONIA', 'DA-F'),
          // Round 3
          m('ba_r3_1', 3, 'BBTV 1', 'SKYHAWKS'),
          m('ba_r3_2', 3, 'TEAM ARCHERS', 'ENITONIA'),
          m('ba_r3_3', 3, 'SWAGGER', 'DA-F'),
          // Round 4
          m('ba_r4_1', 4, 'BBTV 1', 'ENITONIA'),
          m('ba_r4_2', 4, 'TEAM ARCHERS', 'DA-F'),
          m('ba_r4_3', 4, 'SWAGGER', 'SKYHAWKS'),
          // Round 5
          m('ba_r5_1', 5, 'BBTV 1', 'DA-F'),
          m('ba_r5_2', 5, 'TEAM ARCHERS', 'SWAGGER'),
          m('ba_r5_3', 5, 'ENITONIA', 'SKYHAWKS'),
        ],
      },
      groupB: {
        teams: ['BBTV 2', 'KASA BOYS', 'SBMF', 'TEAM APEX BALLERS'],
        fixtures: [
          // Round 1 (fixed)
          m('bb_r1_1', 1, 'BBTV 2', 'KASA BOYS'),
          m('bb_r1_2', 1, 'SBMF', 'TEAM APEX BALLERS'),
          // Round 2
          m('bb_r2_1', 2, 'BBTV 2', 'SBMF'),
          m('bb_r2_2', 2, 'KASA BOYS', 'TEAM APEX BALLERS'),
          // Round 3
          m('bb_r3_1', 3, 'BBTV 2', 'TEAM APEX BALLERS'),
          m('bb_r3_2', 3, 'KASA BOYS', 'SBMF'),
        ],
      },
      knockout: {
        sf1: { id: 'b_sf1', home: null, away: null, homeScore: null, awayScore: null, status: 'pending' },
        sf2: { id: 'b_sf2', home: null, away: null, homeScore: null, awayScore: null, status: 'pending' },
        final: { id: 'b_final', home: null, away: null, homeScore: null, awayScore: null, status: 'pending' },
      },
    },
  };
}
