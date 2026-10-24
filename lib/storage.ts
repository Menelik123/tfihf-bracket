'use client';

import type { TournamentState } from './types';

const LS_KEY = 'tfihf_tournament_state';

function lsLoad(): TournamentState | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(LS_KEY);
  return raw ? (JSON.parse(raw) as TournamentState) : null;
}

function lsSave(state: TournamentState) {
  if (typeof window !== 'undefined') localStorage.setItem(LS_KEY, JSON.stringify(state));
}

async function apiLoad(): Promise<TournamentState | null> {
  const res = await fetch('/api/state', { cache: 'no-store' });
  if (!res.ok) return null;
  const { state } = await res.json();
  return state ?? null;
}

async function apiSave(state: TournamentState): Promise<void> {
  await fetch('/api/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }),
  });
}

export let isLive = false;

export async function loadState(): Promise<TournamentState | null> {
  try {
    const state = await apiLoad();
    if (state) {
      isLive = true;
      lsSave(state);
      return state;
    }
  } catch { /* fall through */ }
  isLive = false;
  return lsLoad();
}

export async function saveState(state: TournamentState): Promise<void> {
  lsSave(state);
  try {
    await apiSave(state);
    isLive = true;
  } catch {
    isLive = false;
  }
}

export function startPolling(callback: (state: TournamentState) => void): () => void {
  const id = setInterval(async () => {
    try {
      const state = await apiLoad();
      if (state) {
        isLive = true;
        callback(state);
      }
    } catch { /* silent */ }
  }, 3000);
  return () => clearInterval(id);
}
