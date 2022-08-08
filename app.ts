import express, { Express } from "express";
import session from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";

// Import routes
import authRoutes from "./routes/authRoutes";

dotenv.config();

const app = (store: PrismaSessionStore): Express => {
    const server: Express = express();

    // Enable CORS app wide, for more information on how to use this package
    // please refer to https://www.npmjs.com/package/cors
    server.use(cors());

    // Enable express-rate-limit, for more information on how to use this package
    // please refer to https://www.npmjs.com/package/express-rate-limit
    // This middleware is disabled for the test environment as it causes issues
    const limiter = rateLimit({
        windowMs: 1000, // 1000 milliseconds / 1 second
        max: 2, // Limit each IP to 2 requests per `window` (here, per 1 second)
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });

    if (process.env.NODE_ENV !== "test") {
        server.use(limiter);
    }

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
    server.use("/", (req, res) => {
        return res.status(200).json({
            status: "success",
            message: "This is the web service API for the DevPrep project",
        });
    });

    return server;
};

export default app;
