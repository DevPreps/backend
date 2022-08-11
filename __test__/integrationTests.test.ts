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

describe("Integration tests for AUTH routes:", () => {
    // Register route handler
    // -------------------------------------------------------------------------

    describe("/api/auth/register", () => {
        test("POST with valid values should respond with 201 CREATED", async () => {
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
    });

    // VALIDATION TESTS [400]:
    // Prevent registration if fields missing
    // Reject invalid inputs
    // Reject unexpected attributes
    // Others

    // Login route handler
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
            expect(typeof response.headers["set-cookie"]).toBeDefined();
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
    });

    // Validation Tests [400]:

    // Logout route handler
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

            // Logout
            const logoutResponse = await axios.get("/api/auth/logout");
            expect(logoutResponse.status).toBe(200);
        });
    });

    // 200 OK logged out - is logged in (THIS REQUIRES A MIDDLEWARE TO CHECK IF USER IS LOGGED IN)
    // 401 Unauthorized if not logged in - (THIS REQUIRES A MIDDLEWARE TO CHECK IF USER IS LOGGED IN)

    // User update route handler

    describe("/api/user/update", () => {
        test("User is able to update their user data", async () => {
            // Create a user
            const initialUser = await axios.post("api/auth/register", {
                userName: "Achilles",
                email: "achilles@email.com",
                password: "iTookAnArrowToTheHeel!",
            });
            expect(await db.user.count()).toBe(1);

            // Login the new user
            const response = await axios.post("/api/auth/login", {
                email: "achilles@email.com",
                password: "iTookAnArrowToTheHeel!",
            });
            expect(response.status).toBe(200);
            expect(response.data.data.id).toBeDefined();

            // Get session cookie
            if (!response.headers["set-cookie"]){
                throw new Error("No cookie returned");};
            const cookie: string = response.headers["set-cookie"][0]
            // Update our user
            const updatedUser = await axios.put("/api/user/update", {
                userName: "Homer",
                email: "homer@gmail.com",
                password: "iTookAnArrowToTheHeel!",
            }, {headers: {Cookie: cookie}});
            expect(updatedUser.status).toBe(201);
         //   expect(updatedUser.data.data.userName).toBe("Homer");
        //    expect(initialUser.data.data.id).toBe(updatedUser.data.data.id);
        });

        test("User is unable to update using an already taken userName", async () => {
            // Create a user
            const initialUser1 = await axios.post("api/auth/register", {
                userName: "Penelope",
                email: "penelope@email.com",
                password: "Password1!",
            });
            expect(await db.user.count()).toBe(1);

            // Create a user
            const initialUser2 = await axios.post("api/auth/register", {
                userName: "Odysseus",
                email: "odysseus@email.com",
                password: "Password1!",
            });
            expect(await db.user.count()).toBe(2);
            expect(initialUser1.data.data.id).not.toBe(
                initialUser2.data.data.id
            );
            // Login the new user
            const response = await axios.post("/api/auth/login", {
                email: "odysseus@email.com",
                password: "Password1!",
            });
            expect(response.status).toBe(200);

            // Get session cookie
            if (!response.headers["set-cookie"]){
                throw new Error("No cookie returned");};
            const cookie: string = response.headers["set-cookie"][0]

            // Update our user
            const updatedUser = await axios.put("/api/user/update", {
                userName: "Penelope",
                email: "odysseus@gmail.com",
                password: "Password1!",
            }, {headers: {Cookie: cookie}});
            expect(updatedUser.status).toBe(400);
        });

        test("User is unable to update using an already taken email", async () => {
            // Create a user
            const initialUser1 = await axios.post("api/auth/register", {
                userName: "Eurycleia",
                email: "eurycleia@email.com",
                password: "Password1!",
            });
            expect(await db.user.count()).toBe(1);

            // Create a user
            const initialUser2 = await axios.post("api/auth/register", {
                userName: "Hercules",
                email: "hercules@email.com",
                password: "Password1!",
            });
            expect(await db.user.count()).toBe(2);
            expect(initialUser1.data.data.id).not.toBe(
                initialUser2.data.data.id
            );
            // Login the new user
            const response = await axios.post("/api/auth/login", {
                email: "hercules@email.com",
                password: "Password1!",
            });

            expect(response.status).toBe(200);

            // Get session cookie
            if (!response.headers["set-cookie"]){
                throw new Error("No cookie returned");};
            const cookie: string = response.headers["set-cookie"][0]

            // Update our user
            const updatedUser = await axios.put("/api/user/update", {
                userName: "Hercules",
                email: "eurycleia@email.com",
                password: "Password1!",
            }, {headers: {Cookie: cookie}});
            expect(updatedUser.status).toBe(400);
        });

        test("User is unable to be updated without a valid session", async () => {
            // Create a user
            await axios.post("api/auth/register", {
                userName: "Jupiter",
                email: "jupiter@email.com",
                password: "Password1!",
            });
            expect(await db.user.count()).toBe(1);

            // Lets not login and get a cookie for this one

            // Update our user
            const updatedUser = await axios.put("/api/user/update", {
                userName: "Jupiter",
                email: "jupiter@email.com",
                password: "MyPasswordIsNotGoingToChange!",
            });
            expect(updatedUser.status).toBe(400);
        });
    });
});
