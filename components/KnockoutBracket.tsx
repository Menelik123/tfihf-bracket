'use client';

import { useState } from 'react';
import type { Knockout, KnockoutMatch } from '@/lib/types';
import { finalWinner } from '@/lib/standings';

interface Props {
  knockout: Knockout;
  onSave: (matchId: string, homeScore: number, awayScore: number) => void;
  onClear: (matchId: string) => void;
}

function KOMatchCard({
  label,
  match,
  onSave,
  onClear,
}: {
  label: string;
  match: KnockoutMatch;
  onSave: (h: number, a: number) => void;
  onClear: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [h, setH] = useState(match.homeScore?.toString() ?? '');
  const [a, setA] = useState(match.awayScore?.toString() ?? '');
  const isFinal = match.status === 'final';
  const tbd = !match.home && !match.away;
  const homeWon = isFinal && match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore;
  const awayWon = isFinal && match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore;
  const valid = h !== '' && a !== '' && !isNaN(Number(h)) && !isNaN(Number(a)) && Number(h) >= 0 && Number(a) >= 0;
  const canEdit = !tbd && !!match.home && !!match.away;

  return (
    <div className="rounded-xl border border-white/15 overflow-hidden">
      <div className="bg-white/5 px-3 py-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      </div>
      <button
        onClick={() => canEdit && setEditing(!editing)}
        disabled={!canEdit}
        className="w-full"
      >
        <div className="px-4 py-3 space-y-1">
          {tbd ? (
            <p className="text-center text-gray-500 italic py-2">TBD</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className={`text-sm truncate max-w-[45%] ${homeWon ? 'font-black text-white' : 'font-medium text-gray-300'}`}>
                  {match.home ?? 'TBD'}
                </span>
                <span className="font-black text-yellow-400 tabular-nums mx-2">
                  {isFinal ? match.homeScore : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm truncate max-w-[45%] ${awayWon ? 'font-black text-white' : 'font-medium text-gray-300'}`}>
                  {match.away ?? 'TBD'}
                </span>
                <span className="font-black text-yellow-400 tabular-nums mx-2">
                  {isFinal ? match.awayScore : '—'}
                </span>
              </div>
              {isFinal && <div className="text-right mt-1"><span className="text-[10px] bg-green-700/60 text-green-300 px-1.5 py-0.5 rounded font-bold">FT</span></div>}
            </>
          )}
        </div>
      </button>
      {editing && canEdit && (
        <div className="bg-black/40 px-4 pb-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 pt-3">
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
            <span className="text-white text-xl font-black mt-4">—</span>
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
              onClick={() => { if (valid) { onSave(Number(h), Number(a)); setEditing(false); }}}
              disabled={!valid}
              className="flex-1 bg-yellow-400 text-black font-black py-3 rounded-xl disabled:opacity-40"
            >
              SAVE
            </button>
            {isFinal && (
              <button onClick={() => { onClear(); setEditing(false); }} className="px-4 bg-red-600/80 text-white font-bold py-3 rounded-xl text-sm">
                CLEAR
              </button>
            )}
            <button onClick={() => setEditing(false)} className="px-4 bg-white/10 text-gray-300 font-bold py-3 rounded-xl text-sm">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KnockoutBracket({ knockout, onSave, onClear }: Props) {
  const champion = finalWinner(knockout);

  return (
    <div className="space-y-4">
      {champion && (
        <div className="bg-yellow-400 text-black rounded-2xl p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-1">Champion</p>
          <p className="text-2xl font-black">{champion}</p>
          <p className="text-2xl mt-1">🏆</p>
        </div>
      )}
      <KOMatchCard
        label="Semifinal 1 — (A1 vs B2)"
        match={knockout.sf1}
        onSave={(h, a) => onSave(knockout.sf1.id, h, a)}
        onClear={() => onClear(knockout.sf1.id)}
      />
      <KOMatchCard
        label="Semifinal 2 — (B1 vs A2)"
        match={knockout.sf2}
        onSave={(h, a) => onSave(knockout.sf2.id, h, a)}
        onClear={() => onClear(knockout.sf2.id)}
      />
      <KOMatchCard
        label="Final"
        match={knockout.final}
        onSave={(h, a) => onSave(knockout.final.id, h, a)}
        onClear={() => onClear(knockout.final.id)}
      />
    </div>
  );
}
