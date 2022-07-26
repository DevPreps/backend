import { RequestHandler } from "express";

export const register = (): RequestHandler => (req, res, next) => {
    return res.status(201).json()
}

export const login = (): RequestHandler => (req, res, next) => {
    return res.status(200).json()
}