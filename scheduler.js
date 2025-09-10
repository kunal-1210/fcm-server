// scheduler.js
const admin = require('./firebase'); // reuse the single Firebase app

async function checkBookingsAndNotify() {
  console.log("⏰ Scheduler triggered!");

  const now = new Date();
  const nowHours = now.getHours();
  const nowMinutes = now.getMinutes();

  // Fetch all bookings
  const snapshot = await admin.database().ref("bookings").once("value");
  const bookings = snapshot.val();

  if (!bookings) {
    console.log("ℹ️ No bookings found.");
    return;
  }

  // Loop through each booking
  for (const key in bookings) {
    const booking = bookings[key];
    const bookingRef = admin.database().ref(`bookings/${key}`);

    console.log(`🔍 Checking booking ${key}...`);

    if (!booking.pickuptime) {
      console.log(`⚠️ Booking ${key} has no pickuptime set, skipping.`);
      continue;
    }

    // Extract hours and minutes from pickuptime ("HH:mm")
    const [pickupHours, pickupMinutes] = booking.pickuptime.split(":").map(Number);

    // Calculate minutes left until pickup
    const pickupTimeInMinutes = pickupHours * 60 + pickupMinutes;
    const nowInMinutes = nowHours * 60 + nowMinutes;
    const minutesUntilPickup = pickupTimeInMinutes - nowInMinutes;

    console.log(`🕒 Minutes until pickup for booking ${key}: ${minutesUntilPickup}`);

    // Send notification if pickup is within the next 30 minutes and not sent yet
    if (minutesUntilPickup <= 30 && minutesUntilPickup > 0 && !booking.pickupNotificationSent) {

      // Owner notification
      if (booking.ownerfcmToken) {
        try {
          await admin.messaging().send({
            token: booking.ownerfcmToken,
            notification: {
              title: "Upcoming Pickup",
              body: `Your ${booking.carName} booking starts in ${minutesUntilPickup} minutes.`,
            },
            data: { bookingId: key },
          });
          console.log(`📢 Notification sent to owner: ${booking.ownerfcmToken}`);
        } catch (err) {
          console.error(`❌ Failed to send owner notification for booking ${key}:`, err.message);
        }
      }

      // Renter notification
      if (booking.userfcmToken) {
        try {
          await admin.messaging().send({
            token: booking.userfcmToken,
            notification: {
              title: "Pickup Reminder",
              body: `Your booking for ${booking.carName} starts in ${minutesUntilPickup} minutes.`,
            },
            data: { bookingId: key },
          });
          console.log(`📢 Notification sent to renter: ${booking.userfcmToken}`);
        } catch (err) {
          console.error(`❌ Failed to send renter notification for booking ${key}:`, err.message);
        }
      }

      // Mark notification as sent
      await bookingRef.update({ pickupNotificationSent: true });
      console.log(`📝 Booking ${key} marked as notified`);
    } else {
      console.log(`ℹ️ No notification needed for booking ${key} (minutesUntilPickup: ${minutesUntilPickup})`);
    }
  }

  console.log("✅ Scheduler task completed");
}

module.exports = { checkBookingsAndNotify };
