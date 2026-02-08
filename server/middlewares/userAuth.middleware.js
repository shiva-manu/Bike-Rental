import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import redisClient from "../config/redis.js";

const UserAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // Check if token is blacklisted
        const isBlacklisted = await redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) {
            return res.status(401).json({ message: "Session expired. Please login again." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "STUDENT") {
            return res.status(403).json({ message: "Access denied" });
        }

        // Verify user actually exists in DB (handling post-reset scenarios)
        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            return res.status(401).json({ message: "User no longer exists. Please sign up again." });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

export default UserAuth;