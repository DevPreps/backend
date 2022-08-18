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
