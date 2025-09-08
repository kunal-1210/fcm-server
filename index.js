const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

const app = express(); // ✅ Make sure this is here
app.use(bodyParser.json());

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://reg-log-94747-default-rtdb.firebaseio.com"
});

// POST route to send notifications
app.post('/sendNotification', async (req, res) => {
    const { ownerFcmToken, userFcmToken, title, body, bookingId } = req.body;

    try {
        // Send to Owner
        if (ownerFcmToken) {
            const ownerMessage = {
                token: ownerFcmToken,
                notification: {
                    title: title,
                    body: body
                },
                data: { bookingId }
            };
            await admin.messaging().send(ownerMessage);
            console.log("✅ Notification sent to Owner");
        }

        // Send to Renter
        if (userFcmToken) {
            const userMessage = {
                token: userFcmToken,
                notification: {
                    title: title,
                    body: body
                },
                data: { bookingId }
            };
            await admin.messaging().send(userMessage);
            console.log("✅ Notification sent to Renter");
        }

        res.status(200).send({ success: true });
    } catch (err) {
        console.error("❌ Error sending notification:", err);
        res.status(500).send({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
