import { RequestHandler, Request, Response, NextFunction } from "express";
import { PostMethods, PostData } from "../models/postModel";

export const createPost =
    (createPost: PostMethods.CreatePost): RequestHandler =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const postData: PostData = {
                userId: req.session?.user?.id,
                ...req.body,
            };

            const result = await createPost(postData);
            return res.status(201).json({ status: "success", data: result });
        } catch (error) {
            return next(error);
        }
    };
