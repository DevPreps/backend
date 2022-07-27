import { RequestHandler } from "express";
import db from "../models/db";

export const register = (): RequestHandler => async (req, res, next) => {
    return res.status(201).json();
};

export const login = (): RequestHandler => (req, res, next) => {
    return res.status(200).json();
};
