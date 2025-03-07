import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, query, getDocs, updateDoc, doc, setDoc, where, enableIndexedDbPersistence, getDoc, deleteDoc } from 'firebase/firestore';

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

// Helper function to delete a user completely
export const deleteUserCompletely = async (uid) => {
  try {
    // 1. Delete user document from Firestore
    await deleteDoc(doc(db, "users", uid));
    
    // 2. Attempt to call the Firebase function to delete from Authentication
    // This is a placeholder - will only work after you create and deploy the cloud function
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Not authenticated");
    }
    
    const idToken = await currentUser.getIdToken();
    const functionUrl = `https://us-central1-food-management-system-e3e10.cloudfunctions.net/deleteUser`;
    
    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: uid,
          adminToken: idToken
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete auth user');
      }
      
      return { success: true, message: "User completely deleted" };
    } catch (authError) {
      console.error("Error deleting auth user:", authError);
      return { 
        success: false, 
        message: "User document deleted but auth record remains. Please implement the Firebase function for complete deletion."
      };
    }
  } catch (error) {
    console.error("Error in deleteUserCompletely:", error);
    throw error;
  }
};

// Helper function to handle school admin authentication
export const authenticateSchoolAdmin = async (email, password) => {
  try {
    console.log("Authenticating school admin:", email);
    
    // School constants
    const SCHOOL_ID = "puhulwella-national-college";
    const SCHOOL_NAME = "Puhulwella National College";
    
    // Sign in the user with the provided credentials
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Staff member authenticated:", user.uid);
    
    // Check if user is already in the database and associated with this school
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      // If user exists but is not associated with this school, throw error
      if (userData.schoolId && userData.schoolId !== SCHOOL_ID) {
        await signOut(auth); // Sign out the user
        throw new Error("You are not authorized to access this school's dashboard");
      }
    }
    
    // Check if school document exists
    const schoolRef = doc(db, "schools", SCHOOL_ID);
    const schoolDoc = await getDoc(schoolRef);
    
    if (!schoolDoc.exists()) {
      // Create school document if it doesn't exist
      await setDoc(schoolRef, {
        name: SCHOOL_NAME,
        email: email,
        adminId: user.uid,
        address: "Puhulwella, Sri Lanka",
        phoneNumber: "0000000000",
        totalFoodNeeded: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log("Created new school document:", SCHOOL_ID);
    }
    
    // Add or update user document with school_admin role for Puhulwella National College
    await setDoc(userRef, {
      email,
      uid: user.uid,
      role: "school_admin",
      schoolName: SCHOOL_NAME,
      schoolId: SCHOOL_ID,
      lastLogin: new Date().toISOString(),
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
    // For a single school system, just reset the specific school
    const SCHOOL_ID = "puhulwella-national-college";
    await updateDoc(doc(db, 'schools', SCHOOL_ID), {
      totalFoodNeeded: 0
    });
    
    console.log('Reset total food needed for school at:', new Date().toISOString());
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
