import prisma from "../config/prisma.js";
import redisClient from "../config/redis.js";

export const getAllBikes = async (req, res) => {
  try {
    const cachedBikes = await redisClient.get('all_bikes');
    if (cachedBikes) {
      return res.json(JSON.parse(cachedBikes));
    }

    const bikes = await prisma.bike.findMany({
      include: {
        price: {
          where: {
            validFrom: { lte: new Date() },
            OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
          },
          select: { type: true, price: true }
        }
      },
      orderBy: { createdAt: "asc" },
    });

    await redisClient.set('all_bikes', JSON.stringify(bikes), { EX: 3600 }); // Cache for 1 hour
    res.json(bikes);
  } catch (error) {
    console.error("Get all bikes error:", error);
    res.status(500).json({ message: "Failed to fetch bikes" });
  }
}

export const createBike = async (req, res) => {
  const { bikeNo, name, imageUrl, status } = req.body;
  const bike = await prisma.bike.create({
    data: { bikeNo, name, imageUrl, status: status || "AVAILABLE" }
  });

  await redisClient.del('all_bikes');
  res.status(201).json(bike);
}

export const createBikePrice = async (req, res) => {
  const { bikeId } = req.params;
  const { type, price, validFrom } = req.body;

  if (!type || !price || !validFrom) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Check bike exists
  const bike = await prisma.bike.findUnique({
    where: { id: bikeId },
  });

  if (!bike) {
    return res.status(404).json({ message: "Bike not found" });
  }

  // Check if active price already exists for this type
  const activePrice = await prisma.bikePrice.findFirst({
    where: {
      bikeId,
      type,
      validTo: null,
    },
  });

  if (activePrice) {
    // Expire the old price instead of erroring
    await prisma.bikePrice.update({
      where: { id: activePrice.id },
      data: { validTo: new Date() }
    });
  }

  const bikePrice = await prisma.bikePrice.create({
    data: {
      bikeId,
      type,
      price,
      validFrom: new Date(validFrom),
    },
  });

  await redisClient.del('all_bikes');
  await redisClient.del(`bike:${bikeId}`);

  res.status(201).json({
    message: "Bike price created successfully",
    bikePrice,
  });
};

export const getBikeById = async (req, res) => {
  const { id } = req.params;
  try {
    const cachedBike = await redisClient.get(`bike:${id}`);
    if (cachedBike) {
      return res.json(JSON.parse(cachedBike));
    }

    const bike = await prisma.bike.findUnique({
      where: { id },
      include: {
        bookings: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          where: { endDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }
        },
        price: {
          where: {
            validFrom: { lte: new Date() },
            OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
          },
        },
      },
    });

    if (!bike) return res.status(404).json({ message: "Bike not found" });

    await redisClient.set(`bike:${id}`, JSON.stringify(bike), { EX: 600 }); // Cache for 10 min
    res.json(bike);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bike details" });
  }
};

export const deleteBike = async (req, res) => {
  const { id } = req.params;
  try {
    // Delete bike prices first (Prisma handles relations but good to be explicit or if cascade not set)
    await prisma.bikePrice.deleteMany({
      where: { bikeId: id }
    });

    // Delete bookings
    await prisma.booking.deleteMany({
      where: { bikeId: id }
    });

    await prisma.bike.delete({
      where: { id }
    });

    await redisClient.del('all_bikes');
    await redisClient.del(`bike:${id}`);
    res.json({ message: "Bike deleted successfully" });
  } catch (error) {
    console.error("Delete bike error:", error);
    res.status(500).json({ message: "Failed to delete bike" });
  }
};