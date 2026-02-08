import { userLogin, userSignUp, userLogout } from "../controllers/user.controller.js";
import bookBike from "../controllers/booking.controller.js";
import UserAuth from "../middlewares/userAuth.middleware.js";
import express from "express";
const router = express.Router();

// User Auth
router.post("/signup", userSignUp);
router.post("/login", userLogin);
router.post("/logout", UserAuth, userLogout);

// User booking
router.post("/book-bike", UserAuth, bookBike);

export default router