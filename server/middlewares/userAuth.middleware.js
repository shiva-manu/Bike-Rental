import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

const UserAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
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