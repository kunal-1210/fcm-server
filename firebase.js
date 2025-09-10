// firebase.js
const admin = require('firebase-admin');

// Parse the service account from environment variable
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);

// Check if app is already initialized
const app = admin.apps.length
  ? admin.app() // use existing app
  : admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://reg-log-94747-default-rtdb.firebaseio.com"
    });

module.exports = app;
