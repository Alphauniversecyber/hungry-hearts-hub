
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';

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

// Helper function to check if user is authenticated before accessing Firestore
export const fetchWithAuth = async (callback) => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        try {
          const result = await callback();
          resolve(result);
        } catch (error) {
          console.error("Error in fetchWithAuth:", error);
          reject(error);
        }
      } else {
        reject(new Error("User not authenticated"));
      }
    });
  });
};

// Function to reset total food needed for all schools
const resetTotalFoodNeeded = async () => {
  try {
    const schoolsRef = collection(db, 'schools');
    const schoolsSnapshot = await getDocs(schoolsRef);
    
    const promises = schoolsSnapshot.docs.map(schoolDoc => {
      return updateDoc(doc(db, 'schools', schoolDoc.id), {
        totalFoodNeeded: 0
      });
    });

    await Promise.all(promises);
    console.log('Reset total food needed for all schools at:', new Date().toISOString());
  } catch (error) {
    console.error('Error resetting total food needed:', error);
  }
};

// Set up daily reset at midnight
const scheduleReset = () => {
  const now = new Date();
  const night = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // tomorrow
    0, // hours (midnight)
    0, // minutes
    0  // seconds
  );
  
  const msUntilMidnight = night.getTime() - now.getTime();
  
  // Schedule first reset
  setTimeout(() => {
    resetTotalFoodNeeded();
    // Then set up daily interval
    setInterval(resetTotalFoodNeeded, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
};

// Start the scheduling when the app initializes
scheduleReset();
