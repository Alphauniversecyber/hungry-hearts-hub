import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
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

console.log("Initializing Firebase with config:", firebaseConfig);
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
          console.log("User authenticated:", user.uid);
          // Check if user has admin role by fetching their user document
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("uid", "==", user.uid));
          const userSnapshot = await getDocs(q);
          
          let isAuthorized = false;
          let userData = null;
          
          if (!userSnapshot.empty) {
            userData = userSnapshot.docs[0].data();
            console.log("User data found:", userData);
            // Check if user is a superadmin
            if (userData.role === 'superadmin') {
              isAuthorized = true;
            }
          } else {
            console.log("No user document found for UID:", user.uid);
          }
          
          if (isAuthorized) {
            const result = await callback();
            resolve(result);
          } else {
            console.error("User not authorized as superadmin");
            await signOut(auth); // Sign out user if not authorized
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
    console.log("Authenticating super admin:", email);
    // Sign in the user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User signed in:", user.uid);
    
    // Create or update superadmin user if this is the designated superadmin email
    if (email === "programx010@gmail.com") {
      console.log("This is the super admin email, updating user document");
      // Create or update user document for superadmin
      const userData = {
        name: "Super Admin",
        email,
        role: "superadmin",
        uid: user.uid,
        createdAt: new Date().toISOString(),
      };
      
      console.log("Creating/updating super admin document:", userData);
      await setDoc(doc(db, "users", user.uid), userData, { merge: true }); // merge: true will only update fields that are changed
      console.log("Super admin document created/updated");
      return user;
    }
    
    // If not the superadmin email, check if the user is already a superadmin
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("uid", "==", user.uid), where("role", "==", "superadmin"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // If no document matches the criteria, the user is not a superadmin
      console.log("User is not a super admin, signing out");
      await auth.signOut(); // Sign out the user
      throw new Error("Not authorized as Super Admin");
    }
    
    return user;
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
};

// Helper function to handle school admin authentication
export const authenticateSchoolAdmin = async (email, password) => {
  try {
    console.log("Authenticating school admin:", email);
    // Sign in the user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User signed in:", user.uid);
    
    // Check if user is a school admin by querying the users collection
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("uid", "==", user.uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("No user document found for UID:", user.uid);
      
      // Create a user document for this user if it doesn't exist
      console.log("Creating user document for school admin");
      const userData = {
        email,
        uid: user.uid,
        role: "school_admin",
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, "users", user.uid), userData);
      console.log("User document created for school admin");
      
      // Check if there's a school associated with this email
      const schoolsRef = collection(db, "schools");
      const schoolQuery = query(schoolsRef, where("email", "==", email));
      const schoolSnapshot = await getDocs(schoolQuery);
      
      if (schoolSnapshot.empty) {
        console.log("No school document found for email:", email);
        await auth.signOut();
        throw new Error("No school account found for this email");
      }
      
      const schoolData = schoolSnapshot.docs[0].data();
      if (schoolData.status !== "active") {
        console.log("School account not active:", schoolData.status);
        await auth.signOut();
        throw new Error("Your school account is pending approval");
      }
      
      return user;
    }
    
    const userData = querySnapshot.docs[0].data();
    console.log("User data found:", userData);
    
    if (userData.role !== "school_admin") {
      console.log("User is not a school admin:", userData.role);
      await auth.signOut();
      throw new Error("Not authorized as School Admin");
    }
    
    // Additionally, check if the school is approved
    if (userData.schoolId) {
      console.log("Checking school status for ID:", userData.schoolId);
      const schoolRef = collection(db, "schools");
      const schoolQuery = query(schoolRef, where("adminId", "==", user.uid));
      const schoolSnapshot = await getDocs(schoolQuery);
      
      if (!schoolSnapshot.empty) {
        const schoolData = schoolSnapshot.docs[0].data();
        console.log("School data found:", schoolData);
        if (schoolData.status !== "active") {
          console.log("School not active:", schoolData.status);
          await auth.signOut(); // Sign out if school is not active
          throw new Error("Your school account is pending approval");
        }
      } else {
        console.log("No school document found for admin ID:", user.uid);
      }
    } else {
      console.log("No school ID found in user data");
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
