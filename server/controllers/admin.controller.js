import prisma from "../config/prisma.js";
import bcrypt, { hash } from "bcrypt"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET;

// ADMIN SIGNUP
export const adminSignUp = async (req, res) => {
    const { name, email, password } = req.body;
    const existing = await prisma.administrator.findUnique({
        where: { email },
    });

    if (existing) {
        return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.administrator.create({
        data: {
            name,
            email,
            password: hashedPassword,
        }
    });
    res.status(201).json({ message: "Admin created successfully" });
}


// ADMIN LOGIN
export const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    const admin = await prisma.administrator.findUnique({
        where: { email },
    });

    if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
        { id: admin.id, role: "ADMIN" },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
    res.json({
        token,
        admin: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
        }
    });
}

// GET ALL BOOKINGS
export const getBookings = async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    }
                },
                bike: {
                    select: {
                        name: true,
                        bikeNo: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch bookings" });
    }
}

// DELETE A BOOKING
export const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.booking.delete({
            where: { id }
        });
        res.json({ message: "Booking deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete booking" });
    }
}

// UPDATE BOOKING STATUS
export const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const booking = await prisma.booking.update({
            where: { id },
            data: { status }
        });

        // If completed, set bike back to AVAILABLE
        if (status === 'COMPLETED') {
            await prisma.bike.update({
                where: { id: booking.bikeId },
                data: { status: 'AVAILABLE' }
            });
        }

        res.json({ message: `Booking status updated to ${status}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update booking status" });
    }
}