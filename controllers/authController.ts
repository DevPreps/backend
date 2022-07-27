import { RequestHandler, Request, Response, NextFunction } from "express";

// Import TS types
import { UserData, Register } from "../models/userModel";
import { User } from '@prisma/client';
import db from '../models/db'


export const register = (registerUser: Register): RequestHandler => async (req: Request, res: Response, next: NextFunction) => {
    // console.log(await db.user.register({
    //     "userName": "bumblebee",
    //     "email": "johndoe@gmail.com",
    //     "password": "password"
    // }))
    const result: User = await registerUser(req.body);
    console.log(result)
    res.status(201)
    console.log(res.status(201))
    res.json("string");
    return
};

export const login = (): RequestHandler => (req, res) => {
    return res.status(200).json();
};
