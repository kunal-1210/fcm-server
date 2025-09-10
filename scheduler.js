// scheduler.js
const admin = require('./firebase'); // reuse the single Firebase app

async function checkBookingsAndNotify() {
  console.log("⏰ Scheduler triggered!");

  const now = new Date();
  const nowHours = now.getHours();
  const nowMinutes = now.getMinutes();

  const snapshot = await admin.database().ref("Bookings").once("value");

  snapshot.forEach(async (bookingSnap) => {
    const booking = bookingSnap.val();

    if (!booking.pickuptime) return;

    // Extract hours and minutes from pickuptime (format: "HH:mm")
    const [pickupHours, pickupMinutes] = booking.pickuptime.split(":").map(Number);

    // Calculate minutes left until pickup
    const pickupTimeInMinutes = pickupHours * 60 + pickupMinutes;
    const nowInMinutes = nowHours * 60 + nowMinutes;
    const minutesUntilPickup = pickupTimeInMinutes - nowInMinutes;

    // Send notification 30 minutes before pickup
    if (minutesUntilPickup === 30 && !booking.pickupNotificationSent) {

      // Owner notification
      if (booking.ownerfcmToken) {
        await admin.messaging().send({
          token: booking.ownerfcmToken,
          notification: {
            title: "Upcoming Pickup",
            body: `Your ${booking.carName} booking starts in 30 minutes.`,
          },
          data: { bookingId: bookingSnap.key },
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
          data: { bookingId: bookingSnap.key },
        });
        console.log(`📢 Notification sent to renter: ${booking.userfcmToken}`);
      }

      // Mark notification as sent
      await bookingSnap.ref.update({ pickupNotificationSent: true });
    }
  });
}

module.exports = { checkBookingsAndNotify };
