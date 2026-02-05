import prisma from "../config/prisma.js";

export const getAllBikes = async (req, res) => {
  const bikes = await prisma.bike.findMany({
    include: {
      price: {
        where: {
          validFrom: {
            lte: new Date()
          },
          OR: [
            {
              validTo: null,
            },
            {
              validTo: {
                gte: new Date(),
              }
            }
          ],
        },
        select: {
          type: true,
          price: true,
        }
      }
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  res.json(bikes);
}

export const createBike = async (req, res) => {
  const { bikeNo, name, imageUrl, status } = req.body;
  const bike = await prisma.bike.create({
    data: {
      bikeNo,
      name,
      imageUrl,
      status: status || "AVAILABLE",
    }
  });
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

  res.status(201).json({
    message: "Bike price created successfully",
    bikePrice,
  });
};

export const getBikeById = async (req, res) => {
  const { id } = req.params;
  const bike = await prisma.bike.findUnique({
    where: { id },
    include: {
      bookings: {
        select: {
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
        },
        where: {
          // Fetch bookings that are active today or in the future
          endDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      },
      price: {
        where: {
          validFrom: { lte: new Date() },
          OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
        },
      },
    },
  });

  if (!bike) {
    return res.status(404).json({ message: "Bike not found" });
  }
  res.json(bike);
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
    res.json({ message: "Bike deleted successfully" });
  } catch (error) {
    console.error("Delete bike error:", error);
    res.status(500).json({ message: "Failed to delete bike" });
  }
};