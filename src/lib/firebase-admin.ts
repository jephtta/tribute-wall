import { initializeApp, getApps, cert, applicationDefault, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

function getCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as ServiceAccount);
  }
  // Use application default credentials (gcloud auth)
  return applicationDefault();
}

const app =
  getApps().length === 0
    ? initializeApp({
        credential: getCredential(),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      })
    : getApps()[0];

export const adminDb = getFirestore(app, "tribute-wall");
export const adminAuth = getAuth(app);
export const adminStorage = getStorage(app);
export default app;
