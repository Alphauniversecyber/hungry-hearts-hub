
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, getDocs, updateDoc, doc, setDoc, where } from 'firebase/firestore';

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

// Enhanced helper function to check if user is authenticated and has admin rights
export const fetchWithAuth = async (callback) => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        try {
          // Check if user has admin role by fetching their user document
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where("uid", "==", user.uid));
          const userSnapshot = await getDocs(q);
          
          let isAuthorized = false;
          
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            // Check if user is a superadmin
            if (userData.role === 'superadmin') {
              isAuthorized = true;
            }
          }
          
          if (isAuthorized) {
            const result = await callback();
            resolve(result);
          } else {
            console.error("User not authorized as superadmin");
            reject(new Error("User not authorized as superadmin"));
          }
        } catch (error) {
          console.error("Error in fetchWithAuth:", error);
          reject(error);
        }
      } else {
        console.error("User not authenticated");
        reject(new Error("User not authenticated"));
      }
    });
  });
};

// Helper function to authenticate super admin
export const authenticateSuperAdmin = async (email, password) => {
  try {
    // Sign in the user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if user is a superadmin by querying the users collection
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("uid", "==", user.uid), where("role", "==", "superadmin"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // If no document matches the criteria, the user is not a superadmin
      await auth.signOut(); // Sign out the user
      throw new Error("Not authorized as Super Admin");
    }
    
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
