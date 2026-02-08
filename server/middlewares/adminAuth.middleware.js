import jwt from "jsonwebtoken"
import redisClient from "../config/redis.js";

const JWT_SECRET = process.env.JWT_SECRET;

const AdminMiddleWare = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    try {
        // Check blacklist
        const isBlacklisted = await redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) {
            return res.status(401).json({ message: "Session expired. Please login again." });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== "ADMIN") {
            return res.status(403).json({ message: "Access denied" });
        }
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

export default AdminMiddleWare;