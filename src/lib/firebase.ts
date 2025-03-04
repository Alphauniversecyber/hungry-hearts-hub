
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, query, getDocs, updateDoc, doc, setDoc, where, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAqSgN7R9qRo8csE7gznnP4Wlr7zIsVHrg",
  authDomain: "food-management-system-e3e10.firebaseapp.com",
  projectId: "food-management-system-e3e10",
  storageBucket: "food-management-system-e3e10.firebasestorage.app",
  messagingSenderId: "403154940635",
  appId: "1:403154940635:web:0dec5732537bc9a28192fe",
  databaseURL: "https://food-management-system-e3e10-default-rtdb.firebaseio.com"
};

console.log("Initializing Firebase with config:", firebaseConfig);
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence (can help with some connection issues)
enableIndexedDbPersistence(db)
  .then(() => {
    console.log("Firestore persistence enabled successfully");
  })
  .catch((err) => {
    console.error("Error enabling Firestore persistence:", err);
    if (err.code === 'failed-precondition') {
      console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code === 'unimplemented') {
      console.warn("The current browser does not support all of the features required to enable persistence");
    }
  });

// Helper function to handle school admin authentication
export const authenticateSchoolAdmin = async (email, password) => {
  try {
    console.log("Authenticating school admin:", email);
    
    // Sign in the user with the provided credentials
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("School admin signed in:", user.uid);
    
    // Check if the user exists in the 'users' collection with role 'school_admin'
    const userRef = doc(db, "users", user.uid);
    
    // Add or update user document with school_admin role
    await setDoc(userRef, {
      email,
      uid: user.uid,
      role: "school_admin",
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    return user;
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
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
