import admin from "firebase-admin";

interface FirebaseAdminInstances {
  app: admin.app.App | null;
  db: admin.database.Database | null;
  auth: admin.auth.Auth | null;
  isConfigured: boolean;
}

let adminInstances: FirebaseAdminInstances | null = null;

export function getFirebaseAdmin(): FirebaseAdminInstances {
  if (adminInstances) {
    return adminInstances;
  }

  // Cek saklar Cloud vs Lokal (Jika false, nonaktifkan Firebase agar full lokal super cepat)
  if (process.env.ENABLE_CLOUD_FIREBASE === "false" || process.env.NEXT_PUBLIC_ENABLE_CLOUD === "false") {
    adminInstances = {
      app: null,
      db: null,
      auth: null,
      isConfigured: false,
    };
    return adminInstances;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  if (privateKey) {
    // Handle escaped newlines in environment variable
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  const isConfigured = Boolean(projectId && clientEmail && privateKey && databaseURL);

  if (!isConfigured) {
    // Graceful fallback during setup or simulated testing
    adminInstances = {
      app: null,
      db: null,
      auth: null,
      isConfigured: false,
    };
    return adminInstances;
  }

  try {
    let app: admin.app.App;
    if (admin.apps.length === 0) {
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL,
      });
    } else {
      app = admin.apps[0]!;
    }

    const db = admin.database(app);
    const auth = admin.auth(app);

    adminInstances = {
      app,
      db,
      auth,
      isConfigured: true,
    };
    return adminInstances;
  } catch (error) {
    console.error("[Firebase Admin] Initialization failed:", error);
    adminInstances = {
      app: null,
      db: null,
      auth: null,
      isConfigured: false,
    };
    return adminInstances;
  }
}
