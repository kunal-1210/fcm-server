const fetch = require('node-fetch');

module.exports = function(admin) {
    console.log("📅 Scheduler started: checking bookings every 1 minute");

    async function checkBookingsAndNotify() {
        const now = new Date();
        const snapshot = await admin.database().ref("Bookings").once("value");

        snapshot.forEach(bookingSnap => {
            const booking = bookingSnap.val();
            if (!booking.pickupdate || !booking.pickuptime) return;

            const pickupDateTime = new Date(`${booking.pickupdate}T${booking.pickuptime}`);
            const timeToPickup = pickupDateTime - now;
            const thirtyMinutes = 30 * 60 * 1000;

            if (timeToPickup <= thirtyMinutes && timeToPickup > 0 && !booking.pickupNotificationSent) {
                console.log(`Sending PICKUP notification for booking: ${bookingSnap.key}`);
                sendNotification(booking.userfcmToken, "Pickup Reminder", `Pickup for ${booking.carName || "the car"} in 30 minutes.`);
                sendNotification(booking.ownerfcmToken, "Pickup Reminder", `Renter will pick up ${booking.carName || "your car"} in 30 minutes.`);

                admin.database().ref(`Bookings/${bookingSnap.key}`).update({ pickupNotificationSent: true });
            }
        });
    }

    async function sendNotification(token, title, body) {
        if (!token) return console.error("Missing FCM token");
        await fetch("https://fcm-server-kxn1.onrender.com/sendNotification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ownerFcmToken: token, title, body })
        });
    }

    setInterval(checkBookingsAndNotify, 60000);
};
