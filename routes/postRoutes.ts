import express from "express";
import db from "../models/db";
import protect from "../middleware/routeProtector";
import { validate } from "../middleware/validator";
import { postSchema } from "../validation/postValidators";

// Import controllers
import {
    createPost,
    getPostById,
    updatePost,
    deletePost,
    searchPublishedPosts,
} from "../controllers/postController";

const router = express.Router();

router
    .route("/create")
    .post(
        protect({ loggedIn: true }),
        validate(postSchema),
        createPost(db.post.createPost)
    );

router.route("/getPostById").post(getPostById(db.post.getPostById));

router
    .route("/update")
    .post(
        protect({ loggedIn: true }),
        updatePost(db.post.getPostById, db.post.updatePost)
    );

router
    .route("/deletePost/:postId")
    .delete(
        protect({ loggedIn: true }),
        deletePost(db.post.getPostById, db.post.deletePost)
    );

router
    .route("/searchPublishedPosts")
    .post(searchPublishedPosts(db.post.search));

export default router;
