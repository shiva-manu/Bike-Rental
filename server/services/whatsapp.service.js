import twilio from 'twilio';

/**
 * Sends a WhatsApp notification to the admin when a new booking is made.
 */
export const sendBookingNotification = async (bookingDetails) => {
    const {
        userName,
        bikeName,
        startDate,
        endDate,
        startTime,
        endTime,
        priceType,
        totalPrice
    } = bookingDetails;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER; // e.g., 'whatsapp:+14155238886'
    const toNumber = process.env.ADMIN_WHATSAPP_NUMBER;  // e.g., 'whatsapp:+91XXXXXXXXXX'

    if (!accountSid || !authToken || !fromNumber || !toNumber) {
        console.warn('WhatsApp notification skipped: Twilio credentials or numbers not configured in environment.');
        return;
    }

    const client = twilio(accountSid, authToken);

    const messageBody = `*New Booking Alert!* 🚲\n\n` +
        `👤 *User:* ${userName}\n` +
        `🏍️ *Bike:* ${bikeName}\n` +
        `📅 *Plan:* ${priceType}\n` +
        `⏰ *Duration:* ${startDate} (${startTime}) to ${endDate} (${endTime})\n` +
        `💰 *Total Price:* ₹${totalPrice}\n\n` +
        `Please check the admin dashboard for details.`;

    try {
        await client.messages.create({
            body: messageBody,
            from: fromNumber,
            to: toNumber
        });
        console.log(`WhatsApp notification sent to ${toNumber}`);
    } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
    }
};
