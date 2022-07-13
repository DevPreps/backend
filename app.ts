import express, { Express } from "express";
import session from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
// import { PrismaClient } from '@prisma/client';
import { db } from "./index.js";
import dotenv from "dotenv";

dotenv.config();

const app = (): Express => {
	const server: Express = express();

	// Middleware
	server.use(
		session({
			cookie: {
				maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week in milliseconds
			},
			secret: process.env.SESSION_SECRET || "",
			resave: true,
			saveUninitialized: true,
			store: new PrismaSessionStore(db, {
				checkPeriod: 10 * 60 * 1000, // 1 hour in milliseconds
				dbRecordIdIsSessionId: true,
			}),
		})
	);
	server.use(express.json());
	server.use(express.urlencoded({ extended: true }));

	// Route handlers

	return server;
};

export default app;
