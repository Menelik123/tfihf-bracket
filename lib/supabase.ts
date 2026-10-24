'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { TournamentState } from './types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const hasSupabase = !!(url && key);

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (!hasSupabase) return null;
  if (!_client) _client = createClient(url, key);
  return _client;
}

const LS_KEY = 'tfihf_tournament_state';

export async function loadState(): Promise<TournamentState | null> {
  if (hasSupabase) {
    try {
      const sb = getClient()!;
      const { data } = await sb.from('tournament_state').select('state').eq('id', 1).single();
      return (data?.state as TournamentState) ?? null;
    } catch {
      return null;
    }
  }
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(LS_KEY);
  return raw ? (JSON.parse(raw) as TournamentState) : null;
}

export async function saveState(state: TournamentState): Promise<void> {
  if (hasSupabase) {
    await getClient()!.from('tournament_state').upsert({ id: 1, state });
    return;
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }
}

export async function subscribeToState(
  callback: (state: TournamentState) => void
): Promise<() => void> {
  if (!hasSupabase) return () => {};
  const sb = getClient()!;
  const channel = sb
    .channel('tournament_state_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tournament_state' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => {
        if (payload.new?.state) callback(payload.new.state as TournamentState);
      }
    )
    .subscribe();
  return () => { sb.removeChannel(channel); };
}
