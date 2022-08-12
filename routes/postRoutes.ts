import express from "express";
import db from "../models/db";
import protect from "../middleware/routeProtector";

// Import controllers
import { createPost } from "../controllers/postController";

const router = express.Router();

router
    .route("/create")
    .post(protect({ loggedIn: true }), createPost(db.post.createPost));

export default router;
