'use client';

import { useState } from 'react';
import type { Knockout, KnockoutMatch } from '@/lib/types';
import { bracketChampion } from '@/lib/standings';

interface Props {
  knockout: Knockout;
  onSave: (matchId: string, homeScore: number, awayScore: number) => void;
  onClear: (matchId: string) => void;
  onEditTeam: (matchId: string, side: 'home' | 'away', value: string) => void;
  onToggleQF: (hasQF: boolean) => void;
}

function TeamSlot({
  value,
  bold,
  align,
  onEdit,
}: {
  value: string;
  bold: boolean;
  align: 'left' | 'right';
  onEdit: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    setEditing(false);
    if (draft.trim() !== value) onEdit(draft.trim());
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => e.key === 'Enter' && commit()}
        className={`flex-1 bg-white/20 rounded px-2 py-1 text-sm font-bold text-white border border-yellow-400 focus:outline-none text-${align}`}
        placeholder="Team name"
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      className={`flex-1 text-${align} text-sm truncate ${bold ? 'font-black text-white' : 'font-medium text-gray-300'} ${!value ? 'text-gray-600 italic' : ''}`}
    >
      {value || 'tap to set team'}
    </button>
  );
}

function KOCard({
  label,
  match,
  onSave,
  onClear,
  onEditTeam,
}: {
  label: string;
  match: KnockoutMatch;
  onSave: (h: number, a: number) => void;
  onClear: () => void;
  onEditTeam: (side: 'home' | 'away', value: string) => void;
}) {
  const [scoring, setScoring] = useState(false);
  const [h, setH] = useState(match.homeScore?.toString() ?? '');
  const [a, setA] = useState(match.awayScore?.toString() ?? '');
  const isFinal = match.status === 'final';
  const homeWon = isFinal && match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore;
  const awayWon = isFinal && match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore;
  const valid = h !== '' && a !== '' && !isNaN(Number(h)) && !isNaN(Number(a)) && Number(h) >= 0 && Number(a) >= 0;

  return (
    <div className="rounded-xl border border-white/15 overflow-hidden bg-white/[0.03]">
      <div className="px-3 py-1.5 bg-white/5 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
        {isFinal && <span className="text-[10px] bg-green-700/60 text-green-300 px-1.5 py-0.5 rounded font-bold">FT</span>}
      </div>
      <div className="px-4 py-3 space-y-2">
        {/* Home row */}
        <div className="flex items-center gap-2">
          <TeamSlot value={match.home} bold={homeWon} align="left" onEdit={v => onEditTeam('home', v)} />
          <span className={`tabular-nums font-black text-yellow-400 text-base w-8 text-right ${!isFinal ? 'text-gray-600' : ''}`}>
            {isFinal ? match.homeScore : '—'}
          </span>
        </div>
        {/* Away row */}
        <div className="flex items-center gap-2">
          <TeamSlot value={match.away} bold={awayWon} align="left" onEdit={v => onEditTeam('away', v)} />
          <span className={`tabular-nums font-black text-yellow-400 text-base w-8 text-right ${!isFinal ? 'text-gray-600' : ''}`}>
            {isFinal ? match.awayScore : '—'}
          </span>
        </div>
        {/* Score button */}
        <button
          onClick={() => { setH(match.homeScore?.toString() ?? ''); setA(match.awayScore?.toString() ?? ''); setScoring(!scoring); }}
          className="w-full text-xs text-gray-500 hover:text-yellow-400 transition-colors pt-1 text-left"
        >
          {isFinal ? '✏ Edit score' : '+ Enter score'}
        </button>
      </div>
      {scoring && (
        <div className="bg-black/50 px-4 pb-4 border-t border-white/10 space-y-3 pt-3">
          <div className="flex items-center gap-3">
            <input
              type="number" inputMode="numeric" min="0" value={h} onChange={e => setH(e.target.value)}
              className="flex-1 text-3xl font-black text-center bg-white/10 rounded-lg py-3 text-white border border-white/20 focus:border-yellow-400 focus:outline-none"
              placeholder="0" autoFocus
            />
            <span className="text-white text-xl font-black">—</span>
            <input
              type="number" inputMode="numeric" min="0" value={a} onChange={e => setA(e.target.value)}
              className="flex-1 text-3xl font-black text-center bg-white/10 rounded-lg py-3 text-white border border-white/20 focus:border-yellow-400 focus:outline-none"
              placeholder="0"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { if (valid) { onSave(Number(h), Number(a)); setScoring(false); }}}
              disabled={!valid}
              className="flex-1 bg-yellow-400 text-black font-black py-3 rounded-xl disabled:opacity-40"
            >
              SAVE
            </button>
            {isFinal && (
              <button onClick={() => { onClear(); setScoring(false); }} className="px-4 bg-red-600/80 text-white font-bold py-3 rounded-xl text-sm">
                CLEAR
              </button>
            )}
            <button onClick={() => setScoring(false)} className="px-4 bg-white/10 text-gray-300 font-bold py-3 rounded-xl text-sm">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KnockoutBracket({ knockout, onSave, onClear, onEditTeam, onToggleQF }: Props) {
  const champion = bracketChampion(knockout);

  return (
    <div className="space-y-5">
      {/* Size toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-bold">Bracket:</span>
        <div className="flex bg-white/5 rounded-lg p-0.5">
          <button
            onClick={() => onToggleQF(false)}
            className={`px-3 py-1.5 rounded text-xs font-black transition-all ${!knockout.hasQF ? 'bg-white text-black' : 'text-gray-400'}`}
          >
            4 teams
          </button>
          <button
            onClick={() => onToggleQF(true)}
            className={`px-3 py-1.5 rounded text-xs font-black transition-all ${knockout.hasQF ? 'bg-white text-black' : 'text-gray-400'}`}
          >
            8 teams
          </button>
        </div>
        <span className="text-[10px] text-gray-600">tap any team name to edit</span>
      </div>

      {champion && (
        <div className="bg-yellow-400 text-black rounded-2xl p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-1">Champion</p>
          <p className="text-2xl font-black">{champion}</p>
          <p className="text-2xl mt-1">🏆</p>
        </div>
      )}

      {/* QF round */}
      {knockout.hasQF && (
        <>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Quarterfinals</h3>
          <div className="grid grid-cols-1 gap-3">
            {([
              { key: 'qf1', label: 'QF 1' },
              { key: 'qf2', label: 'QF 2' },
              { key: 'qf3', label: 'QF 3' },
              { key: 'qf4', label: 'QF 4' },
            ] as const).map(({ key, label }) => (
              <KOCard
                key={key}
                label={label}
                match={knockout[key]}
                onSave={(h, a) => onSave(knockout[key].id, h, a)}
                onClear={() => onClear(knockout[key].id)}
                onEditTeam={(side, value) => onEditTeam(knockout[key].id, side, value)}
              />
            ))}
          </div>
        </>
      )}

      {/* SF round */}
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Semifinals</h3>
      <div className="grid grid-cols-1 gap-3">
        {([
          { key: 'sf1', label: 'Semifinal 1' },
          { key: 'sf2', label: 'Semifinal 2' },
        ] as const).map(({ key, label }) => (
          <KOCard
            key={key}
            label={label}
            match={knockout[key]}
            onSave={(h, a) => onSave(knockout[key].id, h, a)}
            onClear={() => onClear(knockout[key].id)}
            onEditTeam={(side, value) => onEditTeam(knockout[key].id, side, value)}
          />
        ))}
      </div>

      {/* Final */}
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Final</h3>
      <KOCard
        label="Final"
        match={knockout.final}
        onSave={(h, a) => onSave(knockout.final.id, h, a)}
        onClear={() => onClear(knockout.final.id)}
        onEditTeam={(side, value) => onEditTeam(knockout.final.id, side, value)}
      />
    </div>
  );
}
