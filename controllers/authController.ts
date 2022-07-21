import { RequestHandler } from "express";

export const login = (): RequestHandler => (req, res, next) => {
    return res.status(200).json()
}