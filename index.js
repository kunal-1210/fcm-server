const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

const app = express();
app.use(bodyParser.json());

// Initialize Firebase Admin using the env variable
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

app.post('/sendNotification', async (req, res) => {
    try {
        const { ownerFcmToken, title, body, bookingId } = req.body;

        if (!ownerFcmToken) {
            return res.status(400).send({ success: false, error: "ownerFcmToken is required" });
        }

        const message = {
            notification: { title, body },
            data: { bookingId: bookingId || "" },
            token: ownerFcmToken   // ✅ FIXED
        };

        await admin.messaging().send(message);
        res.status(200).send({ success: true });
    } catch (err) {
        console.error("Error sending notification:", err);
        res.status(500).send({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
