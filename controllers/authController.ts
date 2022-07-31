import { RequestHandler, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";

// Import TS types
import { UserMethods } from "../models/userModel";

export const register =
    (
        getUserByEmail: UserMethods.GetUserByEmail,
        getUserByUserName: UserMethods.GetUserByUserName,
        registerUser: UserMethods.Register
    ): RequestHandler =>
    async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> => {
        try {
            // Check if user already exists
            const userNameExists = await getUserByUserName(req.body.userName);
            const emailExists = await getUserByEmail(req.body.email);
            if (userNameExists || emailExists)
                return res.status(400).json({
                    message:
                        "A user already exists with that username or email address",
                });

            const password = req.body.password;
            const hashedPassword = bcrypt.hashSync(password, 6);
            req.body.password = hashedPassword;

            const result = await registerUser(req.body);
            return res.status(201).json(result);
        } catch (error) {
            return next(error);
        }
    };

export const login = (): RequestHandler => (req, res) => {
    return res.status(200).json();
};
