import express from "express";
import { validateMiddleware } from '../middleware/validator';
import { userSchema } from '../validation/userValidator';

// Import controllers
import { register, login } from "../controllers/authController";

// Import database object
import db from "../models/db";

const router = express.Router();

router.route("/register").post(validateMiddleware(userSchema), register(db.user.findUnique, db.user.register));

router.route("/login").post(login());

export default router;
