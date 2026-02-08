import express from "express";
import { adminLogin, adminSignUp, adminLogout, getBookings, deleteBooking, updateBookingStatus } from "../controllers/admin.controller.js";
import { createBike, getAllBikes, createBikePrice, deleteBike } from "../controllers/bike.controller.js";
import adminAuth from "../middlewares/adminAuth.middleware.js";

const router = express.Router();

// Auth
router.post("/signup", adminSignUp);
router.post("/login", adminLogin);
router.post("/logout", adminAuth, adminLogout);

// Admin panel actions
router.get("/get-all-bikes", getAllBikes);
router.get("/bookings", adminAuth, getBookings);
router.delete("/bookings/:id", adminAuth, deleteBooking);
router.patch("/bookings/:id/status", adminAuth, updateBookingStatus);
router.post("/bikes", adminAuth, createBike);
router.delete("/bikes/:id", adminAuth, deleteBike);
router.post("/bikes/:bikeId/price", adminAuth, createBikePrice);

export default router;