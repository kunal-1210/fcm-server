app.post('/sendNotification', async (req, res) => {
    const { ownerFcmToken, userFcmToken, title, body, bookingId } = req.body;

    try {
        // 1. Send notification to the owner
        if (ownerFcmToken) {
            const ownerMessage = {
                token: ownerFcmToken, // ✅ FIXED missing comma
                notification: {
                    title: title,
                    body: body.owner // separate message for owner
                },
                data: { bookingId }
            };
            await admin.messaging().send(ownerMessage);
            console.log("Notification sent to owner");
        }

        // 2. Send notification to the renter
        if (userFcmToken) {
            const userMessage = {
                token: userFcmToken,
                notification: {
                    title: title,
                    body: body.user // separate message for renter
                },
                data: { bookingId }
            };
            await admin.messaging().send(userMessage);
            console.log("Notification sent to renter");
        }

        res.status(200).send({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, error: err.message });
    }
});
