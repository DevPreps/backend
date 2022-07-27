import app from "./app";
import { Express } from "express"; // Types for Express
import { prisma } from "./models/prisma";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import dotenv from "dotenv";

dotenv.config();
const PORT: string | undefined = process.env.PORT || "3000";

const store = new PrismaSessionStore(prisma, {
    checkPeriod: 10 * 60 * 1000, // 1 hour in milliseconds
    dbRecordIdIsSessionId: true,
});
const server: Express = app(store);

server.listen(PORT, () => {
    console.log(`Server --> Server running at http://localhost:${PORT}`);
});
