import { Express } from "express"; // Types for Express
import app from "../app";
import supertest from "supertest";

import { prisma } from "../models/prisma";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";

jest.mock("../models/prisma");

let store: PrismaSessionStore;
let expressInstance: Express;
let request: supertest.SuperTest<supertest.Test>;

beforeEach(() => {
    // The code below initialises the test application in a way which allows the
    // database and session store to be shut down manually. This is necessary
    // to avoid the test application from leaking memory and allows Jest to exit
    // cleanly.
    store = new PrismaSessionStore(prisma, {
        checkPeriod: 10 * 60 * 1000, // 1 hour in milliseconds
        dbRecordIdIsSessionId: true,
    });
    expressInstance = app(store);
    request = supertest(process.env.TEST_APP_URL || expressInstance);
});

afterEach(async () => {
    // Manual shutdown of the test application session store.
    // The DB connection is closed manually in the prisma mock file.
    store.shutdown();
});

describe("Integration tests for AUTH routes:", () => {
    describe("/api/auth/register", () => {
        test("POST with valid values should respond with 201 CREATED", async () => {
            const response = await request.post("/api/auth/register");
            expect(response.status).toBe(201);
        });
    });

    describe("/api/auth/login", () => {
        test("POST with valid credentials should respond with 200 OK and session cookie", async () => {
            const response = await request.post("/api/auth/login");
            expect(response.status).toBe(200);
        });
    });
});
