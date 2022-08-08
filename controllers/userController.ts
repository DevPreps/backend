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

// Update controller
// -------------------------------------------------------------------------

export const update =
    (
        getUserByEmail: UserMethods.GetUserByEmail,
        getUserByUserName: UserMethods.GetUserByUserName,
        updateUser: UserMethods.UpdateUser
    ): RequestHandler =>
    async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> => {
        try {
            // Check if username and email are already taken
            const userNameExists = await getUserByUserName(req.body.userName);
            const emailExists = await getUserByEmail(req.body.email);
            if (
                (userNameExists && req.body.id !== userNameExists?.id) ||
                (emailExists && req.body.id !== emailExists?.id)
            ) {
                return res.status(400).json({
                    status: "error",
                    message:
                        "A user already exists with that username or email address",
                });
            }
            const password = req.body.password;
            const hashedPassword = bcrypt.hashSync(password, 6);
            req.body.password = hashedPassword;
            const result = await updateUser(req.body.id, req.body);
            return res.status(201).json({ status: "Success", data: result });
        } catch (error) {
            return next(error);
        }
    };
