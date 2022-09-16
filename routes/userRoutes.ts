import express from "express";

// Import controllers
import { update, deleteUser } from "../controllers/userController";
import protect from "../middleware/routeProtector";

// Import database object
import db from "../models/db";

const router = express.Router();

router
    .route("/update")
    .put(
        protect({ loggedIn: true }),
        update(
            db.user.getUserByEmail,
            db.user.getUserByUserName,
            db.user.updateUser
        )
    );

router
    .route("/delete")
    .delete(
        protect({ loggedIn: true }),
        deleteUser(db.user.deleteUser, db.user.getUserById)
    );

export default router;
