import prisma from "../config/prisma.js";

const toDateTime = (date, time12h) => {
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

    // Check bike exists
    const bike = await prisma.bike.findUnique({
        where: { id: bikeId },
    });

    if (!bike) {
        return res.status(404).json({ message: "Bike not found" });
    }

    const inputStartTimestamp = toDateTime(startDate, startTime);
    const inputEndTimestamp = toDateTime(endDate, endTime);

    if (inputStartTimestamp >= inputEndTimestamp) {
        return res.status(400).json({ message: "Invalid time range: Start must be before end" });
    }

    // Check for overlapping booking
    const potentialConflicts = await prisma.booking.findMany({
        where: {
            bikeId,
            status: "BOOKED",
            AND: [
                { startDate: { lte: new Date(endDate) } },
                { endDate: { gte: new Date(startDate) } }
            ]
        }
    });

    const hasConflict = potentialConflicts.some(b => {
        const bStart = toDateTime(b.startDate, b.startTime);
        const bEnd = toDateTime(b.endDate, b.endTime);

        // Standard overlap: S1 < E2 AND E1 > S2
        return (inputStartTimestamp < bEnd && inputEndTimestamp > bStart);
    });

    if (hasConflict) {
        return res.status(409).json({
            message: "Bike not available for this period (Overlaps with existing booking)",
        });
    }

    // Create booking
    const booking = await prisma.booking.create({
        data: {
            userId,
            bikeId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            startTime, // Store 12h string
            endTime,   // Store 12h string
            priceType,
            totalPrice,
        }
    });
    res.status(201).json({
        message: "Bike booked successfully",
        booking,
    });
}

export default bookBike