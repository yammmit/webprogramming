import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);

// Lightweight stub for Firebase Admin to avoid runtime crashes when service account is not present.
// If you need real Firebase Admin functionality (verifyIdToken, user management),
// place your serviceAccountKey.json and initialize firebase-admin here instead.

const adminStub = {
  auth() {
    return {
      // Caller should handle this rejection and fall back to server-side JWT or notify the developer.
      async verifyIdToken() {
        throw new Error(
          "Firebase Admin is not initialized. Place serviceAccountKey.json in backend/src/firebase/ and configure GOOGLE_APPLICATION_CREDENTIALS, or implement server JWT verification instead."
        );
      },
    };
  },
};

console.warn("Firebase Admin stub loaded — admin SDK disabled in this environment.");

export default adminStub;