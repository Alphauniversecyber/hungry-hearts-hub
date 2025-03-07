
# Firebase Cloud Function for User Deletion

To fully delete users (both from Firestore and Authentication), you need to create a Firebase Cloud Function. Follow these steps:

1. Initialize Firebase Cloud Functions in your project:
```bash
firebase init functions
```

2. Create a new function in the `functions/index.js` file:
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Check if request is made by an authenticated admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can delete users.');
  }

  const uid = data.uid;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required.');
  }

  try {
    // Delete the user
    await admin.auth().deleteUser(uid);
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete user from authentication.');
  }
});
```

3. Deploy the function:
```bash
firebase deploy --only functions
```

4. Update your Firebase security rules to ensure only admins can call this function.

## Important Note
Since setting up Cloud Functions requires server-side deployment, as a workaround until you can implement the cloud function:

1. The client code will attempt to delete the Firestore user document.
2. A clear message will be shown to admins if the authentication deletion fails.
3. Consider implementing the Cloud Function as soon as possible to fully secure your application.
