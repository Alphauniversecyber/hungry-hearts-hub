import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAqSgN7R9qRo8csE7gznnP4Wlr7zIsVHrg",
  authDomain: "food-management-system-e3e10.firebaseapp.com",
  projectId: "food-management-system-e3e10",
  storageBucket: "food-management-system-e3e10.firebasestorage.app",
  messagingSenderId: "403154940635",
  appId: "1:403154940635:web:0dec5732537bc9a28192fe",
  databaseURL: "https://food-management-system-e3e10-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);