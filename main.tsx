// Firebase initialization for KPK realtime multiplayer.
// Reads config from Vite env (VITE_FIREBASE_*) or falls back to a placeholder.
// If no databaseURL is provided, the app stays in local-only mode (LOCAL_MODE === true).
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

const env = (import.meta as any).env ?? {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "REPLACE_API_KEY",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "REPLACE.firebaseapp.com",
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || "",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "REPLACE",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "REPLACE.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "0",
  appId: env.VITE_FIREBASE_APP_ID || "1:0:web:0",
};

export const LOCAL_MODE = !firebaseConfig.databaseURL;

let _app: FirebaseApp | null = null;
let _db: Database | null = null;

export function getFirebase(): { app: FirebaseApp; db: Database } | null {
  if (LOCAL_MODE) return null;
  if (!_app) _app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  if (!_db) _db = getDatabase(_app);
  return { app: _app, db: _db };
}

export function generateRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export function generatePlayerId(): string {
  return "p_" + Math.random().toString(36).slice(2, 10);
}