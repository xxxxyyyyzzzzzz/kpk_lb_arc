import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ref, set, get, serverTimestamp } from "firebase/database";
import { getFirebase, LOCAL_MODE } from "@/lib/firebase";

export const Route = createFileRoute("/firebase-test")({
  head: () => ({ meta: [{ title: "Firebase Test" }] }),
  component: FirebaseTest,
});

function FirebaseTest() {
  const [status, setStatus] = useState<string>("idle");
  const [value, setValue] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const fb = getFirebase();

  async function runTest() {
    setError(null);
    setStatus("writing...");
    try {
      if (!fb) throw new Error("Firebase not initialized (LOCAL_MODE). Missing VITE_FIREBASE_DATABASE_URL.");
      const testRef = ref(fb.db, `__connection_test/${Date.now()}`);
      await set(testRef, { ok: true, ts: serverTimestamp(), ua: navigator.userAgent });
      setStatus("reading...");
      const snap = await get(testRef);
      setValue(snap.val());
      setStatus("success ✅");
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setStatus("failed ❌");
    }
  }

  useEffect(() => { runTest(); }, []);

  return (
    <div style={{ padding: 24, fontFamily: "monospace", color: "#eee", background: "#111", minHeight: "100vh" }}>
      <h1>Firebase Realtime DB — Connection Test</h1>
      <p>LOCAL_MODE: <b>{String(LOCAL_MODE)}</b></p>
      <p>Status: <b>{status}</b></p>
      {error && <pre style={{ color: "#f66" }}>{error}</pre>}
      {value !== null && (
        <>
          <p>Round-trip value:</p>
          <pre style={{ background: "#000", padding: 12 }}>{JSON.stringify(value, null, 2)}</pre>
        </>
      )}
      <button onClick={runTest} style={{ marginTop: 16, padding: "8px 16px", cursor: "pointer" }}>
        Run again
      </button>
      <p style={{ marginTop: 24, opacity: 0.7 }}>
        Path written: <code>/__connection_test/&lt;timestamp&gt;</code>
      </p>
    </div>
  );
}
