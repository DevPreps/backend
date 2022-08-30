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
    (deleteUser: UserMethods.DeleteUser): RequestHandler =>
    async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> => {
        try {
            // Check if the request has a session
            if (req?.session?.user?.id) {
                const result = await deleteUser(req?.session?.user?.id);

                // If the user exists, return a status 204:
                if (result) {
                    return res.status(204).json();
                }

                // Else, if the user doesn't exist, return a status 400:
                if (!result) {
                    return res.status(400).json({
                        status: "error",
                        data: `User could not be found, ${req?.session?.user?.id} is not valid`,
                    });
                }
            }

            // If something unexpected happens, catch the error
        } catch (error) {
            return next(error);
        }
    };
