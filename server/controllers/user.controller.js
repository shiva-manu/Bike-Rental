import prisma from "../config/prisma.js";
import redisClient from "../config/redis.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const userSignUp = async (req, res) => {
    const { name, email, password, phone } = req.body;

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            phone
        },
    });

    res.status(201).json({
        message: "User registered successfully",
    });
}

export const userLogin = async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        }
    });

};

export const userLogout = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(400).json({ message: "No token provided" });

        const token = authHeader.split(" ")[1];
        // Expire in 7 days (matching our JWT expiry)
        await redisClient.set(`blacklist:${token}`, 'true', { EX: 7 * 24 * 60 * 60 });

        res.json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Logout failed" });
    }
};