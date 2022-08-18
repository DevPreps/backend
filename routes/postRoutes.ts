import express from "express";
import db from "../models/db";
import protect from "../middleware/routeProtector";

// Import controllers
import {
    createPost,
    getPostById,
    updatePost,
} from "../controllers/postController";

const router = express.Router();

router
    .route("/create")
    .post(
        protect({ loggedIn: true }),
        createPost(db.tag.getAllTags, db.post.createPost)
    );

router.route("/getPostById").post(getPostById(db.post.getPostById));

router.route("/update").post(updatePost(db.post.updatePost));

export default router;
