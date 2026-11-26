import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyFakeKeyForLocalDevOnly",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "smart-dispenser-ukl3.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://smart-dispenser-ukl3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "smart-dispenser-ukl3",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef",
};

let app: FirebaseApp | null = null;
let db: Database | null = null;
let auth: Auth | null = null;

export function getFirebaseClient() {
  if (typeof window === "undefined" || process.env.NEXT_PUBLIC_ENABLE_CLOUD === "false") {
    return { app: null, db: null, auth: null };
  }

  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    db = getDatabase(app);
    auth = getAuth(app);
    return { app, db, auth };
  } catch (err) {
    console.warn("[Firebase Client] Initialized in fallback mode:", err);
    return { app: null, db: null, auth: null };
  }
}
