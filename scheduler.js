// scheduler.js
const admin = require('./firebase'); // reuse the single Firebase app

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

module.exports = { checkBookingsAndNotify };
