const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// Initialize Firebase Admin using environment variable
const app = express();
app.use(bodyParser.json());

// Initialize Firebase Admin using the env variable
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    credential: admin.credential.cert(serviceAccount)
});

app.use(bodyParser.json());

// Route to send FCM notification
app.post('/send', async (req, res) => {
    const { token, title, body } = req.body;
app.post('/sendNotification', async (req, res) => {
    try {
        await admin.messaging().send({
            token,
        const { token, title, body, bookingId } = req.body;
        const message = {
            notification: { title, body },
        });
        res.status(200).send('Notification sent');
    } catch (e) {
        res.status(500).send(e.message);
            data: { bookingId },
            token
        };
        await admin.messaging().send(message);
        res.status(200).send({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));