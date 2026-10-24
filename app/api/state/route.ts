import { NextResponse } from 'next/server';

const KV_KEY = 'tfihf_tournament_state';

export async function GET() {
  try {
    const { kv } = await import('@vercel/kv');
    const state = await kv.get(KV_KEY);
    return NextResponse.json({ state: state ?? null });
  } catch {
    return NextResponse.json({ state: null }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const { state } = await req.json();
    const { kv } = await import('@vercel/kv');
    await kv.set(KV_KEY, state);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'KV unavailable' }, { status: 503 });
  }
}
