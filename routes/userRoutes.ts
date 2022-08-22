import express from "express";

// Import controllers
import { update } from "../controllers/userController";
import protect from "../middleware/routeProtector";

// Import database object
import db from "../models/db";

// Import validator
import { validate } from "../middleware/validator";
import { registerSchema } from "../validation/userValidator";

const router = express.Router();

router
    .route("/update")
    .put(
        protect({ loggedIn: true }),
        validate(registerSchema),
        update(
            db.user.getUserByEmail,
            db.user.getUserByUserName,
            db.user.updateUser
        )
    );

export default router;
