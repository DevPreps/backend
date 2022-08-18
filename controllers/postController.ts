import { RequestHandler, Request, Response, NextFunction } from "express";
import { PostMethods, PostData } from "../models/postModel";
import { TagMethods } from "../models/tagModel";

export const createPost =
    (
        getAllTags: TagMethods.GetAllTags,
        createPost: PostMethods.CreatePost
    ): RequestHandler =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postData: PostData = {
                userId: req.session?.user?.id,
                ...req.body,
            };

            const tags = await getAllTags();
            const tagNames = tags?.map((tag) => tag.name);
            // Reduce has been used to check if the supplied tags exist in the database.
            // This method allows us to explicity return when a tag is not found and prevent
            // the controller from continuing.
            const tagsExist = req.body.postTags.reduce(
                (tagExists: boolean, tag: string) => {
                    if (!tagNames?.includes(tag)) {
                        return tagExists && false;
                    }
                    return tagExists && true;
                },
                true
            );

            if (!tagsExist)
                return res
                    .status(400)
                    .json("One or more of the tags supplied is invalid");

            const result = await createPost(postData);
            return res.status(201).json({ status: "success", data: result });
        } catch (error) {
            return next(error);
        }
    };

export const getPostById =
    (DBGetPostById: PostMethods.GetPostById): RequestHandler =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await DBGetPostById(req.body.postId);
            if (!result)
                return res
                    .status(400)
                    .json({ status: "error", message: "Post not found" });

            return res.status(200).json({ status: "success", data: result });
        } catch (error) {
            return next(error);
        }
    };

export const updatePost =
    (
        DBGetPostById: PostMethods.GetPostById,
        DBUpdatePost: PostMethods.UpdatePost): RequestHandler =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { postId, updatedData } = req.body;

            const post = await DBGetPostById(postId);
            if (!post){
                return res.status(400).json({ status: "error", message: "Post not found" });
            }

            // Check that the logged in user is the author of the post
            if(req?.session?.user?.id !== post?.userId){
                return res.status(403).json({ status: "error", message: "You are not authorised to update this post" });
            }

            // Check that the updated post id is the same as the post id in the database
            if(post?.id !== postId){
                return res.status(400).json({ status: "error", message: "Post id does not match" });
            }

            const result = await DBUpdatePost(postId, updatedData);

            return res.status(200).json({ status: "success", data: result });
        } catch (error) {
            return next(error);
        }
    };
