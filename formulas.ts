// Realtime sync hook: listens to /sessions/{roomCode} and returns the latest snapshot.
// Falls back to a tiny in-memory pub/sub when Firebase is not configured (LOCAL_MODE).
import { useEffect, useState } from "react";
import { onValue, ref, set, get, update, runTransaction } from "firebase/database";
import { getFirebase, LOCAL_MODE } from "@/lib/firebase";
import type { SessionState } from "@/lib/sessionSchema";

// ── Local-mode in-memory store (used only when no Firebase databaseURL) ──
type Listener = (s: SessionState | null) => void;
const localSessions = new Map<string, SessionState>();
const localListeners = new Map<string, Set<Listener>>();

function notify(code: string) {
  const v = localSessions.get(code) ?? null;
  localListeners.get(code)?.forEach((l) => l(v));
}

export const localApi = {
  get: (code: string) => localSessions.get(code) ?? null,
  set: (code: string, v: SessionState) => { localSessions.set(code, v); notify(code); },
  update: (code: string, mut: (s: SessionState) => SessionState) => {
    const cur = localSessions.get(code);
    if (!cur) return;
    localSessions.set(code, mut(cur));
    notify(code);
  },
};

export function useSession(roomCode: string | null): SessionState | null {
  const [snap, setSnap] = useState<SessionState | null>(() =>
    roomCode ? localSessions.get(roomCode) ?? null : null,
  );

  useEffect(() => {
    if (!roomCode) { setSnap(null); return; }
    if (LOCAL_MODE) {
      const set: Listener = (v) => setSnap(v);
      if (!localListeners.has(roomCode)) localListeners.set(roomCode, new Set());
      localListeners.get(roomCode)!.add(set);
      setSnap(localSessions.get(roomCode) ?? null);
      return () => { localListeners.get(roomCode)?.delete(set); };
    }
    const fb = getFirebase();
    if (!fb) return;
    const r = ref(fb.db, `sessions/${roomCode}`);
    const off = onValue(r, (snap) => setSnap((snap.val() as SessionState) ?? null));
    return () => off();
  }, [roomCode]);

  return snap;
}

// ── Mutation helpers shared between Firebase and local-mode ──
export async function writeSession(code: string, value: SessionState): Promise<void> {
  if (LOCAL_MODE) { localApi.set(code, value); return; }
  const fb = getFirebase(); if (!fb) return;
  await set(ref(fb.db, `sessions/${code}`), value);
}

export async function readSession(code: string): Promise<SessionState | null> {
  if (LOCAL_MODE) return localApi.get(code);
  const fb = getFirebase(); if (!fb) return null;
  const r = ref(fb.db, `sessions/${code}`);
  const v = await get(r);
  return (v.val() as SessionState) ?? null;
}

export async function updateSessionPath(code: string, path: string, value: unknown): Promise<void> {
  if (LOCAL_MODE) {
    localApi.update(code, (s) => {
      const parts = path.split("/").filter(Boolean);
      const next = structuredClone(s) as any;
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = cur[parts[i]] ?? {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
      return next as SessionState;
    });
    return;
  }
  const fb = getFirebase(); if (!fb) return;
  await update(ref(fb.db, `sessions/${code}`), { [path]: value });
}

// runTransaction wrapper that works in both modes.
export async function txSession(
  code: string,
  mutator: (s: SessionState | null) => SessionState | undefined,
): Promise<{ ok: boolean; value: SessionState | null }> {
  if (LOCAL_MODE) {
    const cur = localApi.get(code);
    const next = mutator(cur);
    if (!next) return { ok: false, value: cur };
    localApi.set(code, next);
    return { ok: true, value: next };
  }
  const fb = getFirebase(); if (!fb) return { ok: false, value: null };
  const r = ref(fb.db, `sessions/${code}`);
  const result = await runTransaction(r, (cur) => mutator(cur as SessionState | null));
  return { ok: result.committed, value: (result.snapshot.val() as SessionState) ?? null };
}