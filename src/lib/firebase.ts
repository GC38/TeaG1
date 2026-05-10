import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Connectivity check as per instructions
async function testConnection() {
  try {
    // Attempt to reach the server
    await getDocFromServer(doc(db, '_connection_test_', 'check'));
  } catch (error: any) {
    if (error.message && error.message.includes('offline')) {
      console.warn("Firestore appears to be offline. Check your configuration.");
    }
    // Ignore other errors (e.g. permission denied) as the document won't exist
  }
}
testConnection();
