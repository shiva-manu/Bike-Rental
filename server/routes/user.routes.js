import express from "express";
import {userLogin,userSignUp} from "../controllers/user.controller.js";
import bookBike from "../controllers/booking.controller.js";
import UserAuth from "../middlewares/userAuth.middleware.js";

const router=express.Router();

// User Auth
router.post("/signup",userSignUp);
router.post("/login",userLogin);

// User booking
router.post("/book-bike",UserAuth,bookBike);

export default router