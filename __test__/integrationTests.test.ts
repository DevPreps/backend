import { Express } from "express"; // Types for Express
import app from "../app";
import db from "../models/db";
import axios from "axios";

import { prisma } from "../models/prisma";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { Server } from "http";

jest.mock("../models/prisma");

axios.defaults.baseURL = process.env.TEST_APP_URL || "http://localhost:9999";
axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.validateStatus = (status) => status < 500;

let store: PrismaSessionStore;
let expressInstance: Express;
let server: Server;

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
    server = expressInstance.listen(9999);
});

afterEach(async () => {
    // Manual shutdown of the test application session store.
    // The DB connection is closed manually in the prisma mock file.
    await store.shutdown();
    server.close();
});

// Middleware tests
// ----------------------------------------------------------------------------

describe("CORS", () => {
    it("should implement CORS", async () => {
        const response = await axios.get("/");
        expect(response.headers["access-control-allow-origin"]).toEqual("*");
    });
});

describe("Rate limit", () => {
    beforeAll(() => {
        // Change operating environment just for this test as rate limiter is disabled for test environment
        process.env.NODE_ENV = "development";
        expect(process.env.NODE_ENV).toEqual("development");
    });

    afterAll(() => {
        // Reset operating environment
        process.env.NODE_ENV = "test";
        expect(process.env.NODE_ENV).toEqual("test");
    });

    it("Should allow no more than 2 requests per second", async () => {
        const response1 = await axios.get("/");
        const response2 = await axios.get("/");
        const response3 = await axios.get("/");
        expect(response1.status).toBe(200);
        expect(response2.status).toBe(200);
        expect(response3.status).toBe(429);
    });
});

// Register route handler integration tests
// -------------------------------------------------------------------------

describe("Integration tests for AUTH routes:", () => {
    describe("/api/auth/register", () => {
        test("POST with valid values should respond with 201 Created", async () => {
            const response = await axios.post("/api/auth/register", {
                userName: "bumblebee",
                email: "johndoe@email.com",
                password: "password",
            });
            expect(response.status).toBe(201);
        });

        test("responds with 400 Bad Request when userName or email already exist", async () => {
            // Create a user first
            await db.user.register({
                userName: "hercules",
                email: "hulk@email.com",
                password: "password",
            });
            expect(await db.user.count()).toBe(1);

            const response = await axios.post("/api/auth/register", {
                userName: "hercules",
                email: "notTheSameEmail@email.com",
                password: "password",
            });
            expect(response.status).toBe(400);

            const response2 = await axios.post("/api/auth/register", {
                userName: "notTheSameUserName",
                email: "hulk@email.com",
                password: "password",
            });
            expect(response2.status).toBe(400);
        });

        test("responds with 401 Unauthorized when user already logged in", async () => {
            // Create a user first
            await axios.post("/api/auth/register", {
                userName: "loggedInUser",
                email: "loggedin@email.com",
                password: "password",
            });
            expect(await db.user.count()).toBe(1);

            // Log the user in
            const loginResponse = await axios.post("/api/auth/login", {
                email: "loggedin@email.com",
                password: "password",
            });
            expect(loginResponse.status).toBe(200);

            if (!loginResponse.headers["set-cookie"])
                throw new Error("No cookie set");
            expect(loginResponse.headers["set-cookie"][0]).toMatch(/sid/);

            // Get session cookie
            const cookie: string = loginResponse.headers["set-cookie"][0];

            // Try to register a new user when logged in
            const response = await axios({
                url: "/api/auth/register",
                method: "POST",
                headers: {
                    Cookie: cookie,
                },
                data: {
                    userName: "newuser",
                    email: "newuser@email.com",
                    password: "password",
                },
            });
            expect(response.status).toBe(401);
        });
    });

    // VALIDATION TESTS [400]:
    // Prevent registration if fields missing
    // Reject invalid inputs
    // Reject unexpected attributes
    // Others

    // Login route handler integration tests
    // -------------------------------------------------------------------------

    describe("/api/auth/login", () => {
        test("POST with valid credentials should respond with 200 OK and session cookie", async () => {
            // Create a user first
            await axios.post("/api/auth/register", {
                userName: "validUser",
                email: "valid@email.com",
                password: "Abc-1234",
            });
            expect(await db.user.count()).toBe(1);

            const response = await axios.post("/api/auth/login", {
                email: "valid@email.com",
                password: "Abc-1234",
            });
            expect(response.status).toBe(200);
            expect(response.data.data.userName).toBe("validUser");
            expect(response.headers["set-cookie"]).toBeDefined();
        });

        test("responds with 400 Bad Request if email does not exist in the database", async () => {
            // Make sure there are no users in the database
            expect(await db.user.count()).toBe(0);

            const response = await axios.post("/api/auth/login", {
                email: "badcredentials@email.com",
                password: "Abc-1234",
            });

            expect(response.status).toBe(400);
        });

        test("responds with 400 Bad Request if user credentials do not match", async () => {
            // Create a user first
            await db.user.register({
                userName: "badcreds",
                email: "badcreds@email.com",
                password: "Abc-1234",
            });
            expect(await db.user.count()).toBe(1);

            const response = await axios.post("/api/auth/login", {
                email: "badcreds@email.com",
                password: "Abc-1234",
            });
            expect(response.status).toBe(400);
        });

        test("responds with 401 Unauthorized if user is already logged in", async () => {
            // Create a user first
            await axios.post("/api/auth/register", {
                userName: "loggedInUser",
                email: "loggedin@email.com",
                password: "password",
            });
            expect(await db.user.count()).toBe(1);

            // Log the user in
            const loginResponse = await axios.post("/api/auth/login", {
                email: "loggedin@email.com",
                password: "password",
            });
            expect(loginResponse.status).toBe(200);

            if (!loginResponse.headers["set-cookie"])
                throw new Error("No cookie set");
            expect(loginResponse.headers["set-cookie"][0]).toMatch(/sid/);

            // Get session cookie
            const cookie: string = loginResponse.headers["set-cookie"][0];

            // Try to login again when logged in
            const response = await axios({
                url: "/api/auth/login",
                method: "POST",
                headers: {
                    Cookie: cookie,
                },
                data: {
                    email: "loggedin@email.com",
                    password: "password",
                },
            });
            expect(response.status).toBe(401);
        });
    });

    // Validation Tests [400]:

    // Logout route handler integration tests
    // -------------------------------------------------------------------------

    describe("/api/auth/logout", () => {
        test("responds with 200 OK without session cookie", async () => {
            // Create a user first
            await axios.post("/api/auth/register", {
                userName: "logoutUser",
                email: "logout@email.com",
                password: "Abc-1234",
            });
            expect(await db.user.count()).toBe(1);

            // Login first
            const response = await axios.post("/api/auth/login", {
                email: "logout@email.com",
                password: "Abc-1234",
            });
            expect(response.status).toBe(200);

            // Get session cookie
            if (!response.headers["set-cookie"])
                throw new Error("No cookie returned");
            const cookie: string = response.headers["set-cookie"][0];

            // Logout
            const logoutResponse = await axios.get("/api/auth/logout", {
                headers: {
                    Cookie: cookie,
                },
            });
            expect(logoutResponse.status).toBe(200);
        });

        test("responds with 401 Unauthorized without session cookie", async () => {
            const response = await axios.get("/api/auth/logout");
            expect(response.status).toBe(401);
        });
    });
});

// Post route handler integration tests
// -------------------------------------------------------------------------
describe("Integration tests for POST routes:", () => {
    describe("/api/posts/create", () => {
        test("responds with 201 Created and returns the created post", async () => {
            const response = await axios.post("/api/posts/create");
            expect(response.status).toBe(201);
        });
    });
});

// returns 400 error with invalid inputs