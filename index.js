const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

const app = express();
app.use(bodyParser.json());

// Initialize Firebase Admin using the environment variable
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://reg-log-94747-default-rtdb.firebaseio.com" // optional if you use DB
});

// Route to send FCM notification
app.post('/sendNotification', async (req, res) => {
    const { token, title, body, bookingId } = req.body;

    const message = {
        token,
        notification: { title, body },
        data: { bookingId },
    };

    try {
        await admin.messaging().send(message);
        res.status(200).send({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
