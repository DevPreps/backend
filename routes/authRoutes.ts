import express from "express";

// Import controllers
import { register, login } from "../controllers/authController";

// Import database object
import db from "../models/db";

const router = express.Router();

router.route("/register").post(register(db.user.register));

router.route("/login").post(login());

export default router;
