import { NextFunction, Request, Response } from "express";
import { AnyObjectSchema } from "yup";

export const validate = (schema: AnyObjectSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.validate(req.body, { stripUnknown: false });
            return next();
        } catch (error) {
            return res.status(400).json({ error });
        }
    };
};
