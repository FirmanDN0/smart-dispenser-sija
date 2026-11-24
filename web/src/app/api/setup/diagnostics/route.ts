import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function GET() {
  const adminState = getFirebaseAdmin();
  const envCheck = {
    NEXT_PUBLIC_FIREBASE_API_KEY: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: Boolean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    NEXT_PUBLIC_FIREBASE_DATABASE_URL: Boolean(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    FIREBASE_ADMIN_CLIENT_EMAIL: Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL),
    FIREBASE_ADMIN_PRIVATE_KEY: Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
    DEVICE_TOKEN_SHA256: Boolean(process.env.DEVICE_TOKEN_SHA256),
  };

  let rtdbConnected = false;
  let deviceLastSeen: number | null = null;
  let rtdbError: string | null = null;

  if (adminState.isConfigured && adminState.db) {
    try {
      const snap = await adminState.db.ref("devices/dispenser01/lastSeen").once("value");
      deviceLastSeen = snap.val();
      rtdbConnected = true;
    } catch (e: unknown) {
      rtdbError = e instanceof Error ? e.message : "Gagal membaca database";
    }
  }

  const allEnvConfigured = Object.values(envCheck).every(Boolean);

  return NextResponse.json({
    status: allEnvConfigured && rtdbConnected ? "HEALTHY" : "NEEDS_CONFIGURATION",
    timestamp: Date.now(),
    environment: {
      allConfigured: allEnvConfigured,
      details: envCheck,
    },
    firebaseAdmin: {
      isInitialized: adminState.isConfigured,
      rtdbConnected,
      rtdbError,
    },
    device: {
      deviceId: "dispenser01",
      lastSeen: deviceLastSeen,
      isRecentlyOnline: deviceLastSeen ? (Date.now() - deviceLastSeen < 10000) : false,
    },
  });
}
