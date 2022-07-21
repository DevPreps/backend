import express, { Express } from "express";
import session from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import dotenv from "dotenv";

// Import routes
import authRoutes from "./routes/authRoutes";

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

	// Route handlers
    server.use("/api/auth", authRoutes);

	return server;
};

export default app;
