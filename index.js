const admin = require("firebase-admin");
const serviceAccount = require("./SERVICE_ACCOUNT_KEY"); // your Firebase service account JSON
const scheduler = require("./scheduler");

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL:  "https://reg-log-94747-default-rtdb.firebaseio.com" 
});

console.log("✅ Firebase initialized");

// Start scheduler
scheduler(admin);

// Optional: Run an express server to keep Render alive (optional)
const express = require("express");
const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
    res.send("Server running...");
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
