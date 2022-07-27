import express, { Express } from "express";
import session from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = (store: PrismaSessionStore): Express => {
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
			store: store,
		})
	);
	server.use(express.json());
	server.use(express.urlencoded({ extended: true }));


	// Enable CORS app wide
	server.use(cors())

	// Route handlers

	// This is a test route that will be removed in the future
	// It is here to test that the testing pipeline works
	server.get("/", (req, res) => {
		res.status(200).send("Hello World!");
	});

	return server;
};

export default app;
