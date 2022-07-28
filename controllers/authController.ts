import { RequestHandler, Request, Response, NextFunction } from "express";

// Import TS types
import { Register } from "../models/userModel";
import { User } from "@prisma/client";

export const register =
    (registerUser: Register): RequestHandler =>
    async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const result: User = await registerUser(req.body);
        return res.status(201).json(result);
    };

export const login = (): RequestHandler => (req, res) => {
    return res.status(200).json();
};
