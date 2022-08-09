import { RequestHandler, Request, Response, NextFunction } from "express";
import { PostMethods } from "../models/postModel";

export const createPost =
    (createPost: PostMethods.CreatePost): RequestHandler => async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await createPost(req.body)
            return res.status(201).json({ status: "success", data: result });
        } catch (error) {
            return next(error);
        }
    };
