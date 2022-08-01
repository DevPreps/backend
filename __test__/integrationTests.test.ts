import { Express } from "express"; // Types for Express
import app from "../app";
import db from "../models/db";
import axios from "axios";

import { prisma } from "../models/prisma";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { Server } from "http";

import { faker } from '@faker-js/faker';

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
        checkPeriod: 10 * 60 * 1000, // 1 hour in milliseconds
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
    describe("/api/auth/register", () => {
        test("POST with valid values should respond with 201 CREATED", async () => {
            const response = await axios.post("/api/auth/register", {
                userName: "bumblebee",
                email: "johndoe@gmail.com",
                password: "password",
            });
            expect(response.status).toBe(201);
        });

        test("responds with 400 Bad Request when userName or email already exist", async () => {
            // Create a user first
            await db.user.register({
                userName: "hercules",
                email: "hulk@gmail.com",
                password: "password",
            });
            expect(await db.user.count()).toBe(1);

            const response = await axios.post("/api/auth/register", {
                userName: "hercules",
                email: "notTheSameEmail@gmail.com",
                password: "password",
            });
            expect(response.status).toBe(400);

            const response2 = await axios.post("/api/auth/register", {
                userName: "notTheSameUserName",
                email: "hulk@gmail.com",
                password: "password",
            });
            expect(response2.status).toBe(400);
        });
    });

    // user validation test
    describe("user validation test : ", () => {
        test.each([
            {missingFieldName: 'firstName', expectedMessage: 'invalid firstname'},
            {missingFieldName: 'lastName', expectedMessage: 'invalid lastname'},
            {missingFieldName: 'userName', expectedMessage: 'invalid username'},
            {missingFieldName: 'email', expectedMessage: 'invalid email'},
            {missingFieldName: 'password', expectedMessage: 'invalid password'},
            {missingFieldName: 'role', expectedMessage: 'invalid role'},
        ])(`return 400 when $missingFieldName field is missing`,
           async ({missingFieldName, expectedMessage}) => {
            const user: User = createRandomUser();
    
            delete user[missingFieldName as keyof typeof user];
    
            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
            expect(response.data.message).toBe(expectedMessage);
        });
    
        test('return 400 when password is too short', async () => {
            const user: User = {
                ...createRandomUser(),
                password: '123'
            };
    
            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
            expect(response.data.message).toBe(`password should be at least 4 characters`);
        })
    })

    // prevent password from being returned with user object

    // Prevent registration if username or email already exists in DB
    // Check that password hashed
    // VALIDATION TESTS [400]:
    // Prevent registration if fields missing
    // Reject invalid inputs
    // Reject unexpected attributes
    // Others

    describe("/api/auth/login", () => {
        test("POST with valid credentials should respond with 200 OK and session cookie", async () => {
            const response = await axios.post("/api/auth/login");
            expect(response.status).toBe(200);
        });
    });
});

interface User {
    userId: string,
    firstName: string,
    lastName: string,
    username: string,
    email: string,
    password: string,
    role: string
}

function createRandomUser(): User {
  return {
    userId: faker.datatype.uuid(),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    username: faker.internet.userName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    role: 'user'
  };
}