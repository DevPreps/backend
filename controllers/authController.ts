import { RequestHandler, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";

// Import TS types
import { Register } from "../models/userModel";
import { User } from "@prisma/client";

export const register =
    (registerUser: Register): RequestHandler =>
    async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        try {
            const password = req.body.password;
            const hashedPassword = bcrypt.hashSync(password, 6);
            req.body.password = hashedPassword;
            
            const result: User = await registerUser(req.body);
            return res.status(201).json(result);
        } catch (error) {
            return next(error);
        }
    };

export const login = (): RequestHandler => (req, res) => {
    return res.status(200).json();
};
