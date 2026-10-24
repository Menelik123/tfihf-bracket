'use client';

import { useEffect, useState, useCallback } from 'react';
import type { TournamentState, DivisionKey, Match, KnockoutMatch } from '@/lib/types';
import { buildSeedState } from '@/lib/seed';
import { computeStandings, resolveKnockout } from '@/lib/standings';
import { loadState, saveState, startPolling, isLive } from '@/lib/storage';
import StandingsTable from './StandingsTable';
import FixtureList from './FixtureList';
import KnockoutBracket from './KnockoutBracket';

export default function TournamentApp() {
  const [state, setState] = useState<TournamentState | null>(null);
  const [activeTab, setActiveTab] = useState<DivisionKey>('boys');
  const [saving, setSaving] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let stopPolling: (() => void) | null = null;
    (async () => {
      setSyncing(true);
      let loaded = await loadState();
      if (!loaded) {
        loaded = buildSeedState();
        await saveState(loaded);
      }
      setState(loaded);
      setLive(isLive);
      setSyncing(false);

      stopPolling = startPolling((incoming) => {
        setState(incoming);
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

  const updateState = useCallback((
    division: DivisionKey,
    updater: (prev: TournamentState) => TournamentState
  ) => {
    setState(prev => {
      if (!prev) return prev;
      const next = updater(prev);
      // Always re-resolve knockout after any change
      const resolvedKO = resolveKnockout(next[division]);
      const final: TournamentState = {
        ...next,
        [division]: { ...next[division], knockout: resolvedKO },
      };
      persist(final);
      return final;
    });
  }, [persist]);

  const handleGroupFixtureSave = useCallback((
    division: DivisionKey,
    group: 'groupA' | 'groupB',
    matchId: string,
    homeScore: number,
    awayScore: number
  ) => {
    updateState(division, (prev) => ({
      ...prev,
      [division]: {
        ...prev[division],
        [group]: {
          ...prev[division][group],
          fixtures: prev[division][group].fixtures.map(f =>
            f.id === matchId
              ? { ...f, homeScore, awayScore, status: 'final' as const }
              : f
          ),
        },
      },
    }));
  }, [updateState]);

  const handleGroupFixtureClear = useCallback((
    division: DivisionKey,
    group: 'groupA' | 'groupB',
    matchId: string
  ) => {
    updateState(division, (prev) => ({
      ...prev,
      [division]: {
        ...prev[division],
        [group]: {
          ...prev[division][group],
          fixtures: prev[division][group].fixtures.map(f =>
            f.id === matchId
              ? { ...f, homeScore: null, awayScore: null, status: 'pending' as const }
              : f
          ),
        },
      },
    }));
  }, [updateState]);

  const handleKOSave = useCallback((
    division: DivisionKey,
    matchId: string,
    homeScore: number,
    awayScore: number
  ) => {
    updateState(division, (prev) => {
      const ko = prev[division].knockout;
      const update = (m: KnockoutMatch) =>
        m.id === matchId ? { ...m, homeScore, awayScore, status: 'final' as const } : m;
      return {
        ...prev,
        [division]: {
          ...prev[division],
          knockout: { sf1: update(ko.sf1), sf2: update(ko.sf2), final: update(ko.final) },
        },
      };
    });
  }, [updateState]);

  const handleKOClear = useCallback((
    division: DivisionKey,
    matchId: string
  ) => {
    updateState(division, (prev) => {
      const ko = prev[division].knockout;
      const clear = (m: KnockoutMatch) =>
        m.id === matchId ? { ...m, homeScore: null, awayScore: null, status: 'pending' as const } : m;
      return {
        ...prev,
        [division]: {
          ...prev[division],
          knockout: { sf1: clear(ko.sf1), sf2: clear(ko.sf2), final: clear(ko.final) },
        },
      };
    });
  }, [updateState]);

  const handleReset = useCallback(async () => {
    const fresh = buildSeedState();
    await persist(fresh);
    setResetConfirm(false);
  }, [persist]);

  if (!state) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-lg font-bold animate-pulse">Loading tournament...</div>
      </div>
    );
  }

  const division = state[activeTab];
  const standingsA = computeStandings(division.groupA.teams, division.groupA.fixtures);
  const standingsB = computeStandings(division.groupB.teams, division.groupB.fixtures);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      {/* Header */}
      <div className="bg-black px-4 pt-safe-top pt-4 pb-4 sticky top-0 z-30 border-b border-white/10">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-black tracking-tight leading-none">{state.title}</h1>
          <div className="flex items-center gap-2">
            {saving && <span className="text-xs text-yellow-400 animate-pulse">saving…</span>}
            {syncing && <span className="text-xs text-blue-400 animate-pulse">syncing…</span>}
            {!live && !syncing && (
              <span className="text-[10px] bg-yellow-900/60 text-yellow-400 px-2 py-0.5 rounded font-bold">LOCAL</span>
            )}
            {live && !saving && !syncing && (
              <span className="text-[10px] bg-green-900/60 text-green-400 px-2 py-0.5 rounded font-bold">LIVE</span>
            )}
          </div>
        </div>
        {/* Tabs */}
        <div className="flex mt-3 max-w-lg mx-auto bg-white/5 rounded-xl p-1">
          {(['boys', 'girls'] as DivisionKey[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg font-black text-sm uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? 'bg-yellow-400 text-black shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

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
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Fixtures</h3>
            <FixtureList
              fixtures={division.groupA.fixtures}
              onSave={(id, h, a) => handleGroupFixtureSave(activeTab, 'groupA', id, h, a)}
              onClear={(id) => handleGroupFixtureClear(activeTab, 'groupA', id)}
            />
          </div>
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
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Fixtures</h3>
            <FixtureList
              fixtures={division.groupB.fixtures}
              onSave={(id, h, a) => handleGroupFixtureSave(activeTab, 'groupB', id, h, a)}
              onClear={(id) => handleGroupFixtureClear(activeTab, 'groupB', id)}
            />
          </div>
        </section>

        <div className="border-t border-white/10" />

        {/* Knockout */}
        <section>
          <h2 className="text-lg font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
            <span className="text-yellow-400">⚡</span> Knockouts
          </h2>
          {!division.groupA.fixtures.every(f => f.status === 'final') ||
           !division.groupB.fixtures.every(f => f.status === 'final') ? (
            <p className="text-sm text-gray-500 italic">
              Complete all group stage games to unlock semifinals.
            </p>
          ) : null}
          <KnockoutBracket
            knockout={division.knockout}
            onSave={(id, h, a) => handleKOSave(activeTab, id, h, a)}
            onClear={(id) => handleKOClear(activeTab, id)}
          />
        </section>

        {/* Reset */}
        <div className="border-t border-white/10 pt-6">
          {!resetConfirm ? (
            <button
              onClick={() => setResetConfirm(true)}
              className="text-xs text-gray-600 hover:text-red-400 transition-colors underline"
            >
              Reset tournament
            </button>
          ) : (
            <div className="bg-red-950/60 border border-red-800 rounded-xl p-4">
              <p className="text-sm font-bold text-red-300 mb-3">
                Wipe all scores? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 bg-red-600 text-white font-black py-3 rounded-xl text-sm"
                >
                  YES, RESET
                </button>
                <button
                  onClick={() => setResetConfirm(false)}
                  className="flex-1 bg-white/10 text-gray-300 font-bold py-3 rounded-xl text-sm"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
