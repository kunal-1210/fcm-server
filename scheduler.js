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

    if (!booking.pickuptime) continue;

    // Extract hours and minutes from pickuptime ("HH:mm")
    const [pickupHours, pickupMinutes] = booking.pickuptime.split(":").map(Number);

    // Calculate minutes left until pickup
    const pickupTimeInMinutes = pickupHours * 60 + pickupMinutes;
    const nowInMinutes = nowHours * 60 + nowMinutes;
    const minutesUntilPickup = pickupTimeInMinutes - nowInMinutes;

    // Send notification 30 minutes before pickup
    if (minutesUntilPickup <= 30 && minutesUntilPickup > 29 && !booking.pickupNotificationSent) {

      // Owner notification
      if (booking.ownerfcmToken) {
        await admin.messaging().send({
          token: booking.ownerfcmToken,
          notification: {
            title: "Upcoming Pickup",
            body: `Your ${booking.carName} booking starts in 30 minutes.`,
          },
          data: { bookingId: key },
        });
        console.log(`📢 Notification sent to owner: ${booking.ownerfcmToken}`);
      }

      // Renter notification
      if (booking.userfcmToken) {
        await admin.messaging().send({
          token: booking.userfcmToken,
          notification: {
            title: "Pickup Reminder",
            body: `Your booking for ${booking.carName} starts in 30 minutes.`,
          },
          data: { bookingId: key },
        });
        console.log(`📢 Notification sent to renter: ${booking.userfcmToken}`);
      }

      // Mark notification as sent
      await bookingRef.update({ pickupNotificationSent: true });
      console.log(`📝 Booking ${key} marked as notified`);
    }
  }

  console.log("✅ Scheduler task completed");
}

module.exports = { checkBookingsAndNotify };
