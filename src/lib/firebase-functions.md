
# Firebase Cloud Function for User Deletion

To fully delete users (both from Firestore and Authentication), you need to create a Firebase Cloud Function. This is necessary because the Firebase Client SDK does not allow admins to delete other users' authentication records.

## Step 1: Set Up Firebase Functions

Initialize Firebase Cloud Functions in your project:

```bash
firebase init functions
```

## Step 2: Create the Delete User Function

Create or update the `functions/index.js` file with this code:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Check if request is made by an authenticated user with admin role
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }
  
  // Get the admin user
  const adminUid = context.auth.uid;
  const adminRef = await admin.firestore().collection('users').doc(adminUid).get();
  
  if (!adminRef.exists || adminRef.data().role !== 'school_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only school admins can delete users.');
  }

  const uid = data.uid;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required.');
  }

  try {
    // Delete the user from Authentication
    await admin.auth().deleteUser(uid);
    
    // We don't need to delete Firestore data here as it's already handled on the client
    // This function is specifically for deleting the auth record
    
    return { success: true, message: "User authentication record deleted successfully" };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete user from authentication: ' + error.message);
  }
});
```

## Step 3: Deploy the Function

Deploy the function to Firebase:

```bash
firebase deploy --only functions
```

## Step 4: Update Your Security Rules

Ensure your Firestore security rules allow school admins to delete user data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow delete: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'school_admin';
    }
    // Add other rules for your collections
  }
}
```

## Testing the Function

After deployment, the function will be available at:
`https://us-central1-[YOUR-PROJECT-ID].cloudfunctions.net/deleteUser`

The client-side code in this application already attempts to call this function when deleting users.

## Troubleshooting

If you encounter issues:

1. Check the Firebase Functions logs in the Firebase Console
2. Verify that your admin account has the correct role ('school_admin')
3. Ensure your Firebase project billing is set up (required for outbound API calls in functions)
4. Test with an HTTP request directly to the function URL with proper authentication

## Security Note

The function checks for authentication and admin role before allowing deletion, which is a security best practice. Never expose user deletion capabilities to non-admin users.
