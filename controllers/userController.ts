//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\
// USER ENTITY UPDATE & DELETE FUNCTIONS  \\
//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

import { RequestHandler, Request, Response, NextFunction } from "express";

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
            const userNameExists = await getUserByUserName(req?.body?.userName);
            const emailExists = await getUserByEmail(req?.body?.email);
            if (
                (userNameExists &&
                    req?.session?.user?.id !== userNameExists?.id) ||
                (emailExists && req?.session?.user?.id !== emailExists?.id)
            )
                return res.status(400).json({
                    status: "error",
                    message:
                        "A user already exists with that username or email address",
                });

            const result = await updateUser(req?.session?.user?.id, req.body);
            return res.status(201).json({ status: "success", data: result });
        } catch (error) {
            return next(error);
        }
    };

// Delete controller
// ----------------------------------------------------------------------------

export const deleteUser =
    (
        deleteUser: UserMethods.DeleteUser,
        getUserById: UserMethods.GetUserById
    ): RequestHandler =>
    async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> => {
        try {
            const userId = req?.session?.user?.id;
            // Check if the user exists
            if (userId) {
                const userExists = await getUserById(userId);
                if (userExists) {
                    // Delete the user that exists in the database
                    await deleteUser(userId);
                    return res.status(204).json();
                }
                if (!userExists) {
                    // Response if the user doesn't exist in the database
                    return res.status(400).json({
                        status: "error",
                        message: "User does not exist",
                    });
                }
                if (!userId) {
                    // Response if the user has no session
                    return res.status(400).json({
                        status: "error",
                        message: "User has no session",
                    });
                }
            }
            // In the case of an exception, catch the error
        } catch (error) {
            return next(error);
        }
    };
