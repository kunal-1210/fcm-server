const admin = require("firebase-admin");
const fetch = require("node-fetch");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json")),
  databaseURL: "https://reg-log-94747-default-rtdb.firebaseio.com"
});

async function checkBookingsAndNotify() {
  const now = new Date();

  const snapshot = await admin.database().ref("Bookings").once("value");

  snapshot.forEach(bookingSnap => {
    const booking = bookingSnap.val();

    // Validate necessary fields
    if (!booking.pickupdate || !booking.pickuptime) return; // skip if incomplete

    // Parse pickup time
    const pickupDateTime = new Date(`${booking.pickupdate}T${booking.pickuptime}`);
    const timeToPickup = pickupDateTime - now;
    const thirtyMinutes = 30 * 60 * 1000; // 30 min in ms

    // ===== PICKUP NOTIFICATION =====
    if (timeToPickup <= thirtyMinutes && timeToPickup > 0 && !booking.pickupNotificationSent) {
      console.log(`Sending PICKUP notification for booking: ${bookingSnap.key}`);

      // Notify renter
      sendNotification(
        booking.userfcmToken,
        "Pickup Reminder",
        `Your pickup for ${booking.carName || "the car"} is in 30 minutes. Please arrive on time.`
      );

      // Notify host
      sendNotification(
        booking.ownerfcmToken,
        "Pickup Reminder",
        `The renter will pick up ${booking.carName || "your car"} in 30 minutes. Please be ready.`
      );

      // Update flag
      admin.database().ref(`Bookings/${bookingSnap.key}`).update({ pickupNotificationSent: true });
    }

    // ===== DROPOFF NOTIFICATION (using endDate if exists) =====
    if (booking.endDate && !booking.dropoffNotificationSent) {
      const dropoffDateTime = new Date(`${booking.endDate}T${booking.pickuptime || "00:00"}`); // fallback to pickupTime
      const timeToDropoff = dropoffDateTime - now;

      if (timeToDropoff <= thirtyMinutes && timeToDropoff > 0) {
        console.log(`Sending DROPOFF notification for booking: ${bookingSnap.key}`);

        // Notify renter
        sendNotification(
          booking.userfcmToken,
          "Drop-off Reminder",
          `Your car drop-off for ${booking.carName || "the car"} is in 30 minutes. Please get ready to return it.`
        );

        // Notify host
        sendNotification(
          booking.ownerfcmToken,
          "Drop-off Reminder",
          `The renter will return ${booking.carName || "your car"} in 30 minutes. Please be ready.`
        );

        // Update flag
        admin.database().ref(`Bookings/${bookingSnap.key}`).update({ dropoffNotificationSent: true });
      }
    }
  });
}

// Function to send notification via your FCM endpoint
async function sendNotification(token, title, body) {
  if (!token) {
    console.error("❌ Missing FCM token, cannot send notification.");
    return;
  }

  try {
    await fetch("https://fcm-server-kxn1.onrender.com/sendNotification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerFcmToken: token,
        title,
        body
      })
    });
    console.log(`✅ Notification sent to token: ${token}`);
  } catch (error) {
    console.error("❌ Error sending notification:", error);
  }
}

// Run every 1 minute
setInterval(checkBookingsAndNotify, 60000);
console.log("Scheduler started... checking bookings every 1 minute.");
