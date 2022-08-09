import express from "express";
import db from "../models/db";
import protect from "../middleware/routeProtector";
import { validate } from "../middleware/validator";
import { registerSchema } from "../validation/userRegisterValidator";

// Import controllers
import { register, login, logout } from "../controllers/authController";

const router = express.Router();

router
    .route("/register")
    .post(
        protect({ loggedIn: false }),
	    validate(registerSchema),
        register(
            db.user.getUserByEmail,
            db.user.getUserByUserName,
            db.user.register
        )
    );

router
    .route("/login")
    .post(
        protect({ loggedIn: false }),
        login(db.user.getCredentials, db.user.getUserByEmail)
    );

router.route("/logout").get(protect({ loggedIn: true }), logout());

export default router;
