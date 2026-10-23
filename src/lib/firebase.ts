import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAuyT7TOWOUrhJ4etlxUP3n-aGeM5QnJGM",
  authDomain: "lmseva-qstss.firebaseapp.com",
  projectId: "lmseva-qstss",
  storageBucket: "lmseva-qstss.firebasestorage.app",
  messagingSenderId: "975656957093",
  appId: "1:975656957093:web:382290ab67935282cf094c"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let dbInstance;
try {
  dbInstance = initializeFirestore(app, { ignoreUndefinedProperties: true });
} catch {
  dbInstance = getFirestore(app);
}

export const firestore = dbInstance;
export default app;
