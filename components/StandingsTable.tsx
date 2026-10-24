'use client';

import type { TeamStanding } from '@/lib/standings';

export default function StandingsTable({ standings }: { standings: TeamStanding[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/10 text-gray-300 text-xs uppercase tracking-wider">
            <th className="text-left px-3 py-2">#</th>
            <th className="text-left px-3 py-2">Team</th>
            <th className="text-center px-2 py-2">P</th>
            <th className="text-center px-2 py-2">W</th>
            <th className="text-center px-2 py-2">L</th>
            <th className="text-center px-2 py-2">PF</th>
            <th className="text-center px-2 py-2">PA</th>
            <th className="text-center px-2 py-2">PD</th>
            <th className="text-center px-2 py-2 font-bold text-white">PTS</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => (
            <tr
              key={s.team}
              className={`border-t border-white/10 ${i < 2 ? 'bg-green-900/20' : ''}`}
            >
              <td className="px-3 py-2 text-gray-400 font-mono">{i + 1}</td>
              <td className="px-3 py-2 font-semibold text-white truncate max-w-[120px]">
                {i < 2 && <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1.5 mb-0.5" />}
                {s.team}
              </td>
              <td className="px-2 py-2 text-center text-gray-300">{s.played}</td>
              <td className="px-2 py-2 text-center text-gray-300">{s.won}</td>
              <td className="px-2 py-2 text-center text-gray-300">{s.lost}</td>
              <td className="px-2 py-2 text-center text-gray-300">{s.pf}</td>
              <td className="px-2 py-2 text-center text-gray-300">{s.pa}</td>
              <td className={`px-2 py-2 text-center font-mono ${s.pd > 0 ? 'text-green-400' : s.pd < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {s.pd > 0 ? '+' : ''}{s.pd}
              </td>
              <td className="px-2 py-2 text-center font-bold text-yellow-400">{s.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-gray-500 px-3 py-1">Green = advances to knockouts</p>
    </div>
  );
}
