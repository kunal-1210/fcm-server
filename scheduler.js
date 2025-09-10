// scheduler.js
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

const app = express();
app.use(bodyParser.json());

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://reg-log-94747-default-rtdb.firebaseio.com"
});

// This function checks bookings and sends notifications
async function checkBookingsAndNotify() {
  console.log("⏰ Scheduler triggered!");

  const now = new Date();
  const snapshot = await admin.database().ref("Bookings").once("value");

  snapshot.forEach(bookingSnap => {
    const booking = bookingSnap.val();

    if (!booking.pickuptime || !booking.pickupdate) return;

    const pickupDateTime = new Date(`${booking.pickupdate} ${booking.pickuptime}`);
    const thirtyMinutesBefore = new Date(pickupDateTime.getTime() - 30 * 60000);

    if (
      now >= thirtyMinutesBefore &&
      now < pickupDateTime &&
      booking.pickupNotificationSent === false
    ) {
      // Send to owner
      if (booking.ownerfcmToken) {
        admin.messaging().send({
          token: booking.ownerfcmToken,
          notification: {
            title: "Upcoming Pickup",
            body: `Your ${booking.carName} booking starts in 30 minutes.`,
          },
          data: { bookingId: bookingSnap.key }
        });
        console.log(`📢 Notification sent to owner: ${booking.ownerfcmToken}`);
      }

      // Send to renter
      if (booking.userfcmToken) {
        admin.messaging().send({
          token: booking.userfcmToken,
          notification: {
            title: "Pickup Reminder",
            body: `Your booking for ${booking.carName} starts in 30 minutes.`,
          },
          data: { bookingId: bookingSnap.key }
        });
        console.log(`📢 Notification sent to renter: ${booking.userfcmToken}`);
      }

      // Mark as sent
      bookingSnap.ref.update({ pickupNotificationSent: true });
    }
  });
}

// ✅ Route to manually trigger scheduler
app.get('/run-scheduler', async (req, res) => {
  try {
    await checkBookingsAndNotify();
    res.status(200).send({ success: true, message: "Scheduler ran successfully!" });
  } catch (err) {
    console.error("❌ Scheduler error:", err);
    res.status(500).send({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Scheduler running on port ${PORT}`));
