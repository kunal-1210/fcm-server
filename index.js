// index.js
const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const admin = require('./firebase'); // Firebase app
const { checkBookingsAndNotify } = require('./scheduler');

const app = express();
app.use(bodyParser.json());

// POST route to send notifications manually
app.post('/sendNotification', async (req, res) => {
  const { ownerFcmToken, userFcmToken, title, body, bookingId } = req.body;

  try {
    if (ownerFcmToken) {
      await admin.messaging().send({
        token: ownerFcmToken,
        notification: { title, body },
        data: { bookingId }
      });
      console.log("✅ Notification sent to Owner");
    }

    if (userFcmToken) {
      await admin.messaging().send({
        token: userFcmToken,
        notification: { title, body },
        data: { bookingId }
      });
      console.log("✅ Notification sent to Renter");
    }

    res.status(200).send({ success: true });
  } catch (err) {
    console.error("❌ Error sending notification:", err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// Cron job: run every minute
cron.schedule('* * * * *', async () => {
  console.log('⏰ Running scheduler every minute');
  try {
    await checkBookingsAndNotify();
    console.log('✅ Scheduler task completed');
  } catch (err) {
    console.error('❌ Scheduler error:', err);
  }
});

app.get('/ping', (req, res) => {
  console.log("📡 Ping received to keep server awake");
  res.status(200).send("Server is alive! 🟢");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
