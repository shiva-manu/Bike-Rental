import prisma from "../config/prisma.js";
import { sendBookingNotification } from "../services/whatsapp.service.js";
import redisClient from "../config/redis.js";

const toDateTime = (date, time12h) => {
    // ... existing helper logic ...
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    const mod = modifier ? modifier.toUpperCase() : 'AM';
    let h = parseInt(hours, 10);
    if (h === 12) h = 0;
    if (mod === 'PM') h += 12;

    const dt = new Date(date);
    dt.setHours(h, parseInt(minutes, 10), 0, 0);
    return dt.getTime();
};

const bookBike = async (req, res) => {
    const { bikeId, startDate, endDate, startTime, endTime, priceType, totalPrice } = req.body;
    const userId = req.user.id;

    try {
        // Check bike and user exist
        const [bike, user] = await Promise.all([
            prisma.bike.findUnique({ where: { id: bikeId } }),
            prisma.user.findUnique({ where: { id: userId } })
        ]);

        if (!bike) return res.status(404).json({ message: "Bike not found" });
        if (!user) return res.status(404).json({ message: "User not found" });

        const inputStartTimestamp = toDateTime(startDate, startTime);
        const inputEndTimestamp = toDateTime(endDate, endTime);

        if (inputStartTimestamp >= inputEndTimestamp) {
            return res.status(400).json({ message: "Invalid time range" });
        }

        // Check for overlapping booking using Redis Cache
        const cacheKey = `bookings:${bikeId}`;
        let potentialConflicts;
        const cached = await redisClient.get(cacheKey);

        if (cached) {
            potentialConflicts = JSON.parse(cached);
        } else {
            potentialConflicts = await prisma.booking.findMany({
                where: {
                    bikeId,
                    status: "BOOKED",
                    endDate: { gte: new Date() } // Only future or current bookings
                }
            });
            await redisClient.set(cacheKey, JSON.stringify(potentialConflicts), { EX: 300 }); // Cache for 5 min
        }

        const hasConflict = potentialConflicts.some(b => {
            const bStart = toDateTime(b.startDate, b.startTime);
            const bEnd = toDateTime(b.endDate, b.endTime);
            return (inputStartTimestamp < bEnd && inputEndTimestamp > bStart);
        });

        if (hasConflict) {
            return res.status(409).json({ message: "Bike not available for this period" });
        }

        // Create booking
        const booking = await prisma.booking.create({
            data: {
                userId, bikeId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                startTime, endTime, priceType, totalPrice,
            }
        });

        // Invalidate caches
        await redisClient.del(cacheKey);
        await redisClient.del(`bike:${bikeId}`);
        await redisClient.del('all_bikes');

        // Trigger WhatsApp Notification (Async - don't block response)
        sendBookingNotification({
            userName: user.name,
            bikeName: bike.name,
            startDate,
            endDate,
            startTime,
            endTime,
            priceType,
            totalPrice
        });

        res.status(201).json({
            message: "Bike booked successfully",
            booking,
        });
    } catch (error) {
        console.error("Booking error:", error);
        res.status(500).json({ message: "Failed to create booking" });
    }
}

export default bookBike;