import express from "express";

// Import controllers
import { register, login, logout } from "../controllers/authController";

// Import database object
import db from "../models/db";

const router = express.Router();

router
    .route("/register")
    .post(
        register(
            db.user.getUserByEmail,
            db.user.getUserByUserName,
            db.user.register
        )
    );

router
    .route("/login")
    .post(login(db.user.getCredentials, db.user.getUserByEmail));

router.route("/logout").get(logout());

export default router;
