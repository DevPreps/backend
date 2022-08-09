import express from "express";
import db from "../models/db";

// Import controllers
import { createPost } from "../controllers/postController";

const router = express.Router();

router.route("/create").post(createPost(db.post.createPost));

export default router;
