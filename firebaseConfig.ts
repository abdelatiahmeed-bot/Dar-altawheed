import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBy9-kDy0JnunaSubLm-VhliTGhP2jZs6o",
  authDomain: "dar-altawheed.firebaseapp.com",
  projectId: "dar-altawheed",
  storageBucket: "dar-altawheed.firebasestorage.app",
  messagingSenderId: "1090036818546",
  appId: "1:1090036818546:web:2439dbc444658f5c4698eb",
  measurementId: "G-3DVF71VRBN"
};

const app = initializeApp(firebaseConfig);

// تفعيل الحفظ الأوفلاين القوي (Persistence)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});