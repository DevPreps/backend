import app from "../app";
import axios from "axios";
import { prisma } from "../models/prisma";

// Import TypeScript types
import { AddressInfo } from "net";
import { Express } from "express"; // Types for Express
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { Server } from "http";

jest.mock("../models/prisma");

axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.validateStatus = (status) => status < 500;

let expressInstance: Express;
let server: Server;
let store: PrismaSessionStore;

beforeEach(async () => {
    // The code below initialises the test application in a way which allows the
    // database and session store to be shut down manually. This is necessary
    // to avoid the test application from leaking memory and allows Jest to exit
    // cleanly.
    store = new PrismaSessionStore(prisma, {
        checkPeriod: 60 * 60 * 1000, // 1 hour in milliseconds
        dbRecordIdIsSessionId: true,
    });
    expressInstance = app(store);
    // Port 0 forces Unix to get the first unused port
    server = expressInstance.listen(0);

    // Set up axios baseURL
    const serverAddress = server?.address() as AddressInfo;
    axios.defaults.baseURL = `http://localhost:${serverAddress.port}`;
});

afterEach(async () => {
    // Manual shutdown of the test application session store.
    // The DB connection is closed manually in the prisma mock file.
    await store.shutdown();
    server.close();
});
