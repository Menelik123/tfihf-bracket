'use client';

import { useState } from 'react';
import type { Match } from '@/lib/types';

interface Props {
  fixtures: Match[];
  onSave: (id: string, homeScore: number, awayScore: number) => void;
  onClear: (id: string) => void;
}

function ScoreEditor({
  match,
  onSave,
  onClear,
  onCancel,
}: {
  match: Match;
  onSave: (h: number, a: number) => void;
  onClear: () => void;
  onCancel: () => void;
}) {
  const [h, setH] = useState(match.homeScore?.toString() ?? '');
  const [a, setA] = useState(match.awayScore?.toString() ?? '');

  const valid = h !== '' && a !== '' && !isNaN(Number(h)) && !isNaN(Number(a)) && Number(h) >= 0 && Number(a) >= 0;

  return (
    <div className="mt-3 bg-black/40 rounded-xl p-4 border border-white/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1 truncate">{match.home}</p>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={h}
            onChange={e => setH(e.target.value)}
            className="w-full text-3xl font-black text-center bg-white/10 rounded-lg py-3 text-white border border-white/20 focus:border-yellow-400 focus:outline-none"
            placeholder="0"
            autoFocus
          />
        </div>
        <span className="text-white text-2xl font-black mt-4">—</span>
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1 truncate">{match.away}</p>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={a}
            onChange={e => setA(e.target.value)}
            className="w-full text-3xl font-black text-center bg-white/10 rounded-lg py-3 text-white border border-white/20 focus:border-yellow-400 focus:outline-none"
            placeholder="0"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => valid && onSave(Number(h), Number(a))}
          disabled={!valid}
          className="flex-1 bg-yellow-400 text-black font-black py-3 rounded-xl text-base disabled:opacity-40 active:scale-95 transition-transform"
        >
          SAVE
        </button>
        {match.status === 'final' && (
          <button
            onClick={onClear}
            className="px-4 bg-red-600/80 text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition-transform"
          >
            CLEAR
          </button>
        )}
        <button
          onClick={onCancel}
          className="px-4 bg-white/10 text-gray-300 font-bold py-3 rounded-xl text-sm active:scale-95 transition-transform"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function FixtureList({ fixtures, onSave, onClear }: Props) {
  const [editing, setEditing] = useState<string | null>(null);

  // Group by round
  const rounds: Record<number, Match[]> = {};
  for (const f of fixtures) {
    (rounds[f.round] ??= []).push(f);
  }

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
                        isFinal
                          ? 'bg-white/5 border-white/10'
                          : 'bg-white/10 border-white/20 hover:bg-white/15'
                      }`}
                    >
                      <span className={`flex-1 text-left text-sm truncate ${homeWon ? 'font-black text-white' : 'font-medium text-gray-300'}`}>
                        {match.home}
                      </span>
                      <span className="mx-3 font-black text-base tabular-nums text-yellow-400 min-w-[52px] text-center">
                        {isFinal ? `${match.homeScore} – ${match.awayScore}` : 'vs'}
                      </span>
                      <span className={`flex-1 text-right text-sm truncate ${awayWon ? 'font-black text-white' : 'font-medium text-gray-300'}`}>
                        {match.away}
                      </span>
                      {isFinal && (
                        <span className="ml-2 text-[10px] bg-green-700/60 text-green-300 px-1.5 py-0.5 rounded font-bold">
                          FT
                        </span>
                      )}
                    </button>
                    {isEditing && (
                      <ScoreEditor
                        match={match}
                        onSave={(h, a) => { onSave(match.id, h, a); setEditing(null); }}
                        onClear={() => { onClear(match.id); setEditing(null); }}
                        onCancel={() => setEditing(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}
