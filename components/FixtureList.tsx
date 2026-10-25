'use client';

import { useState } from 'react';
import type { Match } from '@/lib/types';

interface Props {
  fixtures: Match[];
  editMode: boolean;
  onSave: (id: string, homeScore: number, awayScore: number) => void;
  onClear: (id: string) => void;
  onEditTeams: (id: string, home: string, away: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

function MatchEditor({
  match,
  editMode,
  onSave,
  onClear,
  onEditTeams,
  onDelete,
  onCancel,
}: {
  match: Match;
  editMode: boolean;
  onSave: (h: number, a: number) => void;
  onClear: () => void;
  onEditTeams: (home: string, away: string) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [homeTeam, setHomeTeam] = useState(match.home);
  const [awayTeam, setAwayTeam] = useState(match.away);
  const [h, setH] = useState(match.homeScore?.toString() ?? '');
  const [a, setA] = useState(match.awayScore?.toString() ?? '');
  const valid = h !== '' && a !== '' && !isNaN(Number(h)) && !isNaN(Number(a)) && Number(h) >= 0 && Number(a) >= 0;

  function handleTeamBlur() {
    if (homeTeam !== match.home || awayTeam !== match.away) {
      onEditTeams(homeTeam.trim() || match.home, awayTeam.trim() || match.away);
    }
  }

  return (
    <div className="mt-2 bg-black/50 rounded-xl p-4 border border-white/20 space-y-3">
      {/* Team name inputs (visible always in editor) */}
      <div className="flex items-center gap-2">
        <input
          value={homeTeam}
          onChange={e => setHomeTeam(e.target.value)}
          onBlur={handleTeamBlur}
          placeholder="Home team"
          className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white border border-white/20 focus:border-yellow-400 focus:outline-none"
        />
        <span className="text-gray-500 text-xs font-bold">vs</span>
        <input
          value={awayTeam}
          onChange={e => setAwayTeam(e.target.value)}
          onBlur={handleTeamBlur}
          placeholder="Away team"
          className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white border border-white/20 focus:border-yellow-400 focus:outline-none"
        />
      </div>
      {/* Score inputs */}
      <div className="flex items-center gap-3">
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={h}
          onChange={e => setH(e.target.value)}
          className="flex-1 text-3xl font-black text-center bg-white/10 rounded-lg py-3 text-white border border-white/20 focus:border-yellow-400 focus:outline-none"
          placeholder="0"
          autoFocus
        />
        <span className="text-white text-2xl font-black">—</span>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={a}
          onChange={e => setA(e.target.value)}
          className="flex-1 text-3xl font-black text-center bg-white/10 rounded-lg py-3 text-white border border-white/20 focus:border-yellow-400 focus:outline-none"
          placeholder="0"
        />
      </div>
      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => valid && onSave(Number(h), Number(a))}
          disabled={!valid}
          className="flex-1 bg-yellow-400 text-black font-black py-3 rounded-xl text-sm disabled:opacity-40 active:scale-95 transition-transform"
        >
          SAVE SCORE
        </button>
        {match.status === 'final' && (
          <button onClick={onClear} className="px-4 bg-red-600/80 text-white font-bold py-3 rounded-xl text-sm active:scale-95">
            CLEAR
          </button>
        )}
        {editMode && (
          <button onClick={onDelete} className="px-3 bg-red-900/60 text-red-400 font-bold py-3 rounded-xl text-sm active:scale-95">
            🗑
          </button>
        )}
        <button onClick={onCancel} className="px-4 bg-white/10 text-gray-300 font-bold py-3 rounded-xl text-sm active:scale-95">
          ✕
        </button>
      </div>
    </div>
  );
}

export default function FixtureList({ fixtures, editMode, onSave, onClear, onEditTeams, onDelete, onAdd }: Props) {
  const [editing, setEditing] = useState<string | null>(null);

  const rounds: Record<number, Match[]> = {};
  for (const f of fixtures) (rounds[f.round] ??= []).push(f);

  return (
    <div className="space-y-5">
      {Object.entries(rounds)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([round, matches]) => (
          <div key={round}>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Round {round}
            </h4>
            <div className="space-y-2">
              {matches.map(match => {
                const isEditing = editing === match.id;
                const isFinal = match.status === 'final';
                const homeWon = isFinal && match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore;
                const awayWon = isFinal && match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore;

                return (
                  <div key={match.id}>
                    <button
                      onClick={() => setEditing(isEditing ? null : match.id)}
                      className={`w-full flex items-center px-4 py-3 rounded-xl border transition-all active:scale-[0.98] ${
                        isFinal ? 'bg-white/5 border-white/10' : 'bg-white/10 border-white/20 hover:bg-white/15'
                      }`}
                    >
                      <span className={`flex-1 text-left text-sm truncate ${homeWon ? 'font-black text-white' : 'font-medium text-gray-300'}`}>
                        {match.home || <span className="text-gray-600 italic">TBD</span>}
                      </span>
                      <span className="mx-3 font-black text-base tabular-nums text-yellow-400 min-w-[52px] text-center">
                        {isFinal ? `${match.homeScore} – ${match.awayScore}` : 'vs'}
                      </span>
                      <span className={`flex-1 text-right text-sm truncate ${awayWon ? 'font-black text-white' : 'font-medium text-gray-300'}`}>
                        {match.away || <span className="text-gray-600 italic">TBD</span>}
                      </span>
                      {isFinal && <span className="ml-2 text-[10px] bg-green-700/60 text-green-300 px-1.5 py-0.5 rounded font-bold">FT</span>}
                    </button>
                    {isEditing && (
                      <MatchEditor
                        match={match}
                        editMode={editMode}
                        onSave={(h, a) => { onSave(match.id, h, a); setEditing(null); }}
                        onClear={() => { onClear(match.id); setEditing(null); }}
                        onEditTeams={(home, away) => onEditTeams(match.id, home, away)}
                        onDelete={() => { onDelete(match.id); setEditing(null); }}
                        onCancel={() => setEditing(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      {editMode && (
        <button
          onClick={onAdd}
          className="w-full py-3 rounded-xl border border-dashed border-white/20 text-gray-500 hover:text-white hover:border-white/40 text-sm font-bold transition-colors"
        >
          + Add game
        </button>
      )}
    </div>
  );
}
