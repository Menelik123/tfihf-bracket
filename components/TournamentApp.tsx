'use client';

import { useEffect, useState, useCallback } from 'react';
import type { TournamentState, DivisionKey, Knockout } from '@/lib/types';
import { buildSeedState } from '@/lib/seed';
import { computeStandings, advanceBracket } from '@/lib/standings';
import { loadState, saveState, startPolling, isLive } from '@/lib/storage';
import StandingsTable from './StandingsTable';
import FixtureList from './FixtureList';
import KnockoutBracket from './KnockoutBracket';

let nextId = Date.now();
function uid() { return `m_${++nextId}`; }

export default function TournamentApp() {
  const [state, setState] = useState<TournamentState | null>(null);
  const [activeTab, setActiveTab] = useState<DivisionKey>('boys');
  const [saving, setSaving] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [live, setLive] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    let stopPolling: (() => void) | null = null;
    (async () => {
      setSyncing(true);
      let loaded = await loadState();
      if (!loaded) {
        loaded = buildSeedState();
        await saveState(loaded);
      }
      // Migrate old state that may be missing knockout fields
      loaded = migrateState(loaded);
      setState(loaded);
      setLive(isLive);
      setSyncing(false);
      stopPolling = startPolling((incoming) => {
        setState(migrateState(incoming));
        setLive(true);
      });
    })();
    return () => { stopPolling?.(); };
  }, []);

  const persist = useCallback(async (next: TournamentState) => {
    setState(next);
    setSaving(true);
    await saveState(next);
    setSaving(false);
  }, []);

  // ── Fixture handlers ──────────────────────────────────────────────────────

  const patchFixtures = useCallback((
    division: DivisionKey,
    group: 'groupA' | 'groupB',
    patcher: (fixtures: TournamentState['boys']['groupA']['fixtures']) => TournamentState['boys']['groupA']['fixtures']
  ) => {
    setState(prev => {
      if (!prev) return prev;
      const next: TournamentState = {
        ...prev,
        [division]: {
          ...prev[division],
          [group]: {
            ...prev[division][group],
            fixtures: patcher(prev[division][group].fixtures),
          },
        },
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const handleFixtureSave = useCallback((div: DivisionKey, grp: 'groupA' | 'groupB', id: string, hs: number, as_: number) => {
    patchFixtures(div, grp, fs => fs.map(f => f.id === id ? { ...f, homeScore: hs, awayScore: as_, status: 'final' } : f));
  }, [patchFixtures]);

  const handleFixtureClear = useCallback((div: DivisionKey, grp: 'groupA' | 'groupB', id: string) => {
    patchFixtures(div, grp, fs => fs.map(f => f.id === id ? { ...f, homeScore: null, awayScore: null, status: 'pending' } : f));
  }, [patchFixtures]);

  const handleFixtureEditTeams = useCallback((div: DivisionKey, grp: 'groupA' | 'groupB', id: string, home: string, away: string) => {
    patchFixtures(div, grp, fs => fs.map(f => f.id === id ? { ...f, home, away } : f));
  }, [patchFixtures]);

  const handleFixtureDelete = useCallback((div: DivisionKey, grp: 'groupA' | 'groupB', id: string) => {
    patchFixtures(div, grp, fs => fs.filter(f => f.id !== id));
  }, [patchFixtures]);

  const handleFixtureAdd = useCallback((div: DivisionKey, grp: 'groupA' | 'groupB') => {
    setState(prev => {
      if (!prev) return prev;
      const fixtures = prev[div][grp].fixtures;
      const maxRound = fixtures.reduce((m, f) => Math.max(m, f.round), 0);
      const newFix = { id: uid(), round: maxRound + 1, home: '', away: '', homeScore: null, awayScore: null, status: 'pending' as const };
      const next: TournamentState = {
        ...prev,
        [div]: { ...prev[div], [grp]: { ...prev[div][grp], fixtures: [...fixtures, newFix] } },
      };
      persist(next);
      return next;
    });
  }, [persist]);

  // ── Knockout handlers ─────────────────────────────────────────────────────

  const patchKO = useCallback((
    div: DivisionKey,
    patcher: (ko: Knockout) => Knockout
  ) => {
    setState(prev => {
      if (!prev) return prev;
      const ko = patcher(prev[div].knockout);
      const advanced = advanceBracket(ko);
      const next: TournamentState = { ...prev, [div]: { ...prev[div], knockout: advanced } };
      persist(next);
      return next;
    });
  }, [persist]);

  const handleKOSave = useCallback((div: DivisionKey, id: string, hs: number, as_: number) => {
    patchKO(div, ko => {
      const upd = (m: Knockout[keyof Knockout]) =>
        typeof m === 'object' && m !== null && 'id' in m && (m as { id: string }).id === id
          ? { ...m, homeScore: hs, awayScore: as_, status: 'final' as const }
          : m;
      return { ...ko, qf1: upd(ko.qf1), qf2: upd(ko.qf2), qf3: upd(ko.qf3), qf4: upd(ko.qf4), sf1: upd(ko.sf1), sf2: upd(ko.sf2), third: upd(ko.third), final: upd(ko.final) } as Knockout;
    });
  }, [patchKO]);

  const handleKOClear = useCallback((div: DivisionKey, id: string) => {
    patchKO(div, ko => {
      const upd = (m: Knockout[keyof Knockout]) =>
        typeof m === 'object' && m !== null && 'id' in m && (m as { id: string }).id === id
          ? { ...m, homeScore: null, awayScore: null, status: 'pending' as const }
          : m;
      return { ...ko, qf1: upd(ko.qf1), qf2: upd(ko.qf2), qf3: upd(ko.qf3), qf4: upd(ko.qf4), sf1: upd(ko.sf1), sf2: upd(ko.sf2), third: upd(ko.third), final: upd(ko.final) } as Knockout;
    });
  }, [patchKO]);

  const handleKOEditTeam = useCallback((div: DivisionKey, id: string, side: 'home' | 'away', value: string) => {
    patchKO(div, ko => {
      const upd = (m: Knockout[keyof Knockout]) =>
        typeof m === 'object' && m !== null && 'id' in m && (m as { id: string }).id === id
          ? { ...m, [side]: value }
          : m;
      return { ...ko, qf1: upd(ko.qf1), qf2: upd(ko.qf2), qf3: upd(ko.qf3), qf4: upd(ko.qf4), sf1: upd(ko.sf1), sf2: upd(ko.sf2), third: upd(ko.third), final: upd(ko.final) } as Knockout;
    });
  }, [patchKO]);

  const handleToggleQF = useCallback((div: DivisionKey, hasQF: boolean) => {
    patchKO(div, ko => ({ ...ko, hasQF }));
  }, [patchKO]);

  const handleReset = useCallback(async () => {
    await persist(buildSeedState());
    setResetConfirm(false);
  }, [persist]);

  // ─────────────────────────────────────────────────────────────────────────

  if (!state) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-lg font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  const division = state[activeTab];
  const standingsA = computeStandings(division.groupA.teams, division.groupA.fixtures);
  const standingsB = computeStandings(division.groupB.teams, division.groupB.fixtures);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      {/* Header */}
      <div className="bg-black px-4 pt-4 pb-4 sticky top-0 z-30 border-b border-white/10">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-black tracking-tight leading-none">{state.title}</h1>
          <div className="flex items-center gap-2">
            {saving && <span className="text-xs text-yellow-400 animate-pulse">saving…</span>}
            {syncing && <span className="text-xs text-blue-400 animate-pulse">syncing…</span>}
            {!live && !syncing && <span className="text-[10px] bg-yellow-900/60 text-yellow-400 px-2 py-0.5 rounded font-bold">LOCAL</span>}
            {live && !saving && !syncing && <span className="text-[10px] bg-green-900/60 text-green-400 px-2 py-0.5 rounded font-bold">LIVE</span>}
            <button
              onClick={() => setEditMode(e => !e)}
              className={`text-[11px] px-2.5 py-1 rounded font-black transition-all ${editMode ? 'bg-orange-500 text-white' : 'bg-white/10 text-gray-400'}`}
            >
              {editMode ? 'EDITING' : 'EDIT'}
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex mt-3 max-w-lg mx-auto bg-white/5 rounded-xl p-1">
          {(['boys', 'girls'] as DivisionKey[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg font-black text-sm uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-yellow-400 text-black shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {editMode && (
        <div className="bg-orange-500/10 border-b border-orange-500/30 px-4 py-2 max-w-lg mx-auto">
          <p className="text-xs text-orange-400 font-bold text-center">
            EDIT MODE — tap any game to rename teams, add or delete games
          </p>
        </div>
      )}

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">

        {/* Group A */}
        <section>
          <h2 className="text-lg font-black uppercase tracking-widest text-yellow-400 mb-4 flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-yellow-400 rounded-sm" /> Group A
          </h2>
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Standings</h3>
            <StandingsTable standings={standingsA} />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Fixtures</h3>
          <FixtureList
            fixtures={division.groupA.fixtures}
            editMode={editMode}
            onSave={(id, h, a) => handleFixtureSave(activeTab, 'groupA', id, h, a)}
            onClear={(id) => handleFixtureClear(activeTab, 'groupA', id)}
            onEditTeams={(id, home, away) => handleFixtureEditTeams(activeTab, 'groupA', id, home, away)}
            onDelete={(id) => handleFixtureDelete(activeTab, 'groupA', id)}
            onAdd={() => handleFixtureAdd(activeTab, 'groupA')}
          />
        </section>

        <div className="border-t border-white/10" />

        {/* Group B */}
        <section>
          <h2 className="text-lg font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-blue-400 rounded-sm" /> Group B
          </h2>
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Standings</h3>
            <StandingsTable standings={standingsB} />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Fixtures</h3>
          <FixtureList
            fixtures={division.groupB.fixtures}
            editMode={editMode}
            onSave={(id, h, a) => handleFixtureSave(activeTab, 'groupB', id, h, a)}
            onClear={(id) => handleFixtureClear(activeTab, 'groupB', id)}
            onEditTeams={(id, home, away) => handleFixtureEditTeams(activeTab, 'groupB', id, home, away)}
            onDelete={(id) => handleFixtureDelete(activeTab, 'groupB', id)}
            onAdd={() => handleFixtureAdd(activeTab, 'groupB')}
          />
        </section>

        <div className="border-t border-white/10" />

        {/* Bracket */}
        <section>
          <h2 className="text-lg font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
            <span className="text-yellow-400">⚡</span> Bracket
          </h2>
          <KnockoutBracket
            knockout={division.knockout}
            onSave={(id, h, a) => handleKOSave(activeTab, id, h, a)}
            onClear={(id) => handleKOClear(activeTab, id)}
            onEditTeam={(id, side, value) => handleKOEditTeam(activeTab, id, side, value)}
            onToggleQF={(hasQF) => handleToggleQF(activeTab, hasQF)}
          />
        </section>

        {/* Reset */}
        <div className="border-t border-white/10 pt-6">
          {!resetConfirm ? (
            <button onClick={() => setResetConfirm(true)} className="text-xs text-gray-600 hover:text-red-400 transition-colors underline">
              Reset tournament
            </button>
          ) : (
            <div className="bg-red-950/60 border border-red-800 rounded-xl p-4">
              <p className="text-sm font-bold text-red-300 mb-3">Wipe all scores and team edits? Cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={handleReset} className="flex-1 bg-red-600 text-white font-black py-3 rounded-xl text-sm">YES, RESET</button>
                <button onClick={() => setResetConfirm(false)} className="flex-1 bg-white/10 text-gray-300 font-bold py-3 rounded-xl text-sm">CANCEL</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Migrate old saved state that may be missing new fields
function migrateState(s: TournamentState): TournamentState {
  function migrateKO(ko: TournamentState['boys']['knockout'], prefix: string): TournamentState['boys']['knockout'] {
    const mk = (id: string) => ({ id, home: '', away: '', homeScore: null, awayScore: null, status: 'pending' as const });
    return {
      hasQF: ko.hasQF ?? false,
      qf1: ko.qf1 ?? mk(`${prefix}_qf1`),
      qf2: ko.qf2 ?? mk(`${prefix}_qf2`),
      qf3: ko.qf3 ?? mk(`${prefix}_qf3`),
      qf4: ko.qf4 ?? mk(`${prefix}_qf4`),
      sf1: { ...mk(`${prefix}_sf1`), ...(ko.sf1 ?? {}), home: (ko.sf1 as { home?: string | null })?.home ?? '', away: (ko.sf1 as { away?: string | null })?.away ?? '' },
      sf2: { ...mk(`${prefix}_sf2`), ...(ko.sf2 ?? {}), home: (ko.sf2 as { home?: string | null })?.home ?? '', away: (ko.sf2 as { away?: string | null })?.away ?? '' },
      third: ko.third ?? mk(`${prefix}_third`),
      final: { ...mk(`${prefix}_final`), ...(ko.final ?? {}), home: (ko.final as { home?: string | null })?.home ?? '', away: (ko.final as { away?: string | null })?.away ?? '' },
    };
  }
  return {
    ...s,
    girls: { ...s.girls, knockout: migrateKO(s.girls.knockout, 'g') },
    boys: { ...s.boys, knockout: migrateKO(s.boys.knockout, 'b') },
  };
}
