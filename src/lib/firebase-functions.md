
# Firebase Cloud Function for User Deletion

To fully delete users (both from Firestore and Authentication), you need to deploy a Firebase Cloud Function. This is necessary because the Firebase Client SDK does not allow admins to delete other users' authentication records.

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

// HTTP callable function for deleting users
exports.deleteUser = functions.https.onRequest(async (req, res) => {
  try {
    // Set CORS headers for preflight requests
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    // Validate request method
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }
    
    // Verify authentication
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const adminUid = decodedToken.uid;
    
    // Check if user is an admin
    const adminUser = await admin.firestore().collection('users').doc(adminUid).get();
    if (!adminUser.exists || adminUser.data().role !== 'school_admin') {
      res.status(403).json({ error: 'Unauthorized: Only school admins can delete users' });
      return;
    }
    
    // Get the user ID to delete
    const { uid } = req.body;
    if (!uid) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }
    
    // Delete the user from Authentication
    await admin.auth().deleteUser(uid);
    
    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'User authentication record deleted successfully' 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to delete user: ' + (error.message || 'Unknown error') 
    });
  }
});
```

## Step 3: Deploy the Function

Deploy the function to Firebase:

```bash
firebase deploy --only functions
```

## Step 4: Verify the Function

After deployment, the function will be available at:
`https://us-central1-[YOUR-PROJECT-ID].cloudfunctions.net/deleteUser`

For the food management system, the URL would be:
`https://us-central1-food-management-system-e3e10.cloudfunctions.net/deleteUser`

## Important Notes

1. The function requires proper authentication with a valid ID token
2. Only users with the 'school_admin' role can delete other users
3. This is an HTTP function (not a callable function) so it needs to be called with fetch/axios
4. The client-side code in the application now handles partial success states gracefully

## Testing in Development

During development, the application now skips the authentication record deletion and displays a friendly message. This allows you to test the user interface without affecting your Firebase Authentication records.

In production, the function will attempt to delete both Firestore data and Authentication records.
