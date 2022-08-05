import { NextFunction, Request, Response } from "express";
import { AnyObjectSchema } from "yup";

export const validateMiddleware = (schema: AnyObjectSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.validate(req.body);
            return next();
        } catch(error) {
            return res.status(400).json({error});
        }
    };
};
