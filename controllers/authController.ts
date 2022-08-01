import { RequestHandler, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";

// Import TS types
import { UserMethods } from "../models/userModel";
import { User } from "@prisma/client";

// Extend express-session SessionData to include user data
declare module "express-session" {
    interface SessionData {
        user: User;
        loggedIn: boolean;
    }
}

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
                    status: "error",
                    message:
                        "A user already exists with that username or email address",
                });

            const password = req.body.password;
            const hashedPassword = bcrypt.hashSync(password, 6);
            req.body.password = hashedPassword;

            const result = await registerUser(req.body);
            return res.status(201).json({ status: "success", data: result });
        } catch (error) {
            return next(error);
        }
    };

export const login =
    (
        getCredentials: UserMethods.GetCredentials,
        getUserByEmail: UserMethods.GetUserByEmail
    ): RequestHandler =>
    async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const credentials = await getCredentials(email);
            // Check if user exists
            if (!credentials)
                return res.status(400).json({
                    status: "error",
                    message: "Invalid email or password",
                });
            // Check if password is correct
            if (!bcrypt.compareSync(password, credentials.password))
                return res.status(400).json({
                    status: "error",
                    message: "Invalid email or password",
                });

            // Get user object
            const user = await getUserByEmail(email);

            // Set session variables
            if (user) {
                req.session.user = user;
                req.session.loggedIn = true;
            }

            return res.status(200).json({ status: "success", data: user });
        } catch (error) {
            return next(error);
        }
    };
