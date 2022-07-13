import app from "./app.js";
import { Express } from "express"; // Types for Express
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();
const PORT: string | undefined = process.env.PORT || "3000";

export const db = new PrismaClient();

const server: Express = app();

server.listen(PORT, () => {
	console.log(`Server --> Server running at http://localhost:${PORT}`);
});
