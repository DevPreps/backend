import "./testSetup";
import axios from "axios";
import db from "../models/db";
import { fkRegistrationData, fkLoginData, LoginData } from "./faker";

// Import TypeScript types
import { RegistrationData } from "../models/userModel";

describe("Integration tests for AUTH routes:", () => {
    // Register route handler integration tests
    // -------------------------------------------------------------------------
    describe("/api/auth/register", () => {
        test("POST with valid values should respond with 201 Created", async () => {
            const response = await axios.post("/api/auth/register", {
                userName: "bumblebee",
                email: "johndoe@email.com",
                password: "Abc-1234",
            });
            expect(response.status).toBe(201);
        });

        test("responds with 400 Bad Request when userName or email already exist", async () => {
            // Create a user first
            await db.user.register({
                userName: "hercules",
                email: "hulk@email.com",
                password: "Abc-1234",
            });
            expect(await db.user.count()).toBe(1);

            const response = await axios.post("/api/auth/register", {
                userName: "hercules",
                email: "notTheSameEmail@email.com",
                password: "Abc-1234",
            });
            expect(response.status).toBe(400);

            const response2 = await axios.post("/api/auth/register", {
                userName: "notTheSameUserName",
                email: "hulk@email.com",
                password: "Abc-1234",
            });
            expect(response2.status).toBe(400);
        });

        test("responds with 401 Unauthorized when user already logged in", async () => {
            // Create a user first
            await axios.post("/api/auth/register", {
                userName: "loggedInUser",
                email: "loggedin@email.com",
                password: "Abc-1234",
            });
            expect(await db.user.count()).toBe(1);

            // Log the user in
            const loginResponse = await axios.post("/api/auth/login", {
                email: "loggedin@email.com",
                password: "Abc-1234",
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
                    password: "Abc-1234",
                },
            });
            expect(response.status).toBe(401);
        });
    });

    // VALIDATION TESTS:
    // user validation test
    describe("Validation: ", () => {
        let user: RegistrationData;

        beforeEach(() => {
            // Create a user registration object
            user = fkRegistrationData();
        });

        test.each([
            { missingFieldName: "userName" },
            { missingFieldName: "email" },
            { missingFieldName: "password" },
        ])(
            "responds with 400 Bad Request when $missingFieldName is missing",
            async ({ missingFieldName }) => {
                delete user[missingFieldName as keyof typeof user];

                const response = await axios.post("api/auth/register", user);

                expect(response.status).toBe(400);
            }
        );

        test("responds with 400 Bad Request when request data contains unexpected data", async () => {
            const response = await axios.post("/api/auth/register", {
                ...user,
                unexpectedKey: "unexpected value",
            });
            expect(response.status).toBe(400);
        });

        // username validation test
        test("return 400 when username is too short", async () => {
            user.userName = "awe";

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        test("return 400 when username is too long", async () => {
            user.userName = "awe1234567890awesome";

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        test("return 400 when username has invalid special characters", async () => {
            user.userName = "awesome*";

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        test("return 400 when username has consecutive (-) (_) (.)) characters", async () => {
            user.userName = "awe__some";

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        test("return 400 when username starts with a special character", async () => {
            user.userName = "_awesome";

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        // email validation test
        test("return 400 when email is invalid", async () => {
            // No domain
            {
                user.email = "awesome@awesome";

                const response = await axios.post("api/auth/register", user);
                expect(response.status).toBe(400);
            }

            // No mail server
            {
                user.email = "awesome.com";

                const response = await axios.post("api/auth/register", user);
                expect(response.status).toBe(400);
            }

            // No username
            {
                user.email = ".awe@some.com";

                const response = await axios.post("api/auth/register", user);
                expect(response.status).toBe(400);
            }
        });

        // password validation test
        test("return 400 when password is too short", async () => {
            user.password = "123";

            const response = await axios.post("api/auth/login", user);
            expect(response.status).toBe(400);
        });

        test("return 400 when password is too long", async () => {
            user.password = "!Aa0123123Awesome";

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        test("return 400 when password does not include at least one lowercase character", async () => {
            user.password = "!A0123AWESOME";

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        test("return 400 when password does not include at least one uppercase character", async () => {
            user.password = "!a0123awesome";

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        test("return 400 when password does not include at least one number", async () => {
            user.password = "!Aawesome";

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        test("return 400 when password does not include at least one special character", async () => {
            user.password = "Aa01wesome";

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });
    });

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
                password: "Abc-1234",
            });
            expect(await db.user.count()).toBe(1);

            // Log the user in
            const loginResponse = await axios.post("/api/auth/login", {
                email: "loggedin@email.com",
                password: "Abc-1234",
            });
            expect(loginResponse.status).toBe(200);

            if (!loginResponse.headers["set-cookie"])
                throw new Error("No cookie set");
            expect(loginResponse.headers["set-cookie"][0]).toMatch(/sid/);

            // Get session cookie
            const cookie: string = loginResponse.headers["set-cookie"][0];

            // Try to login again when already logged in
            const response = await axios({
                url: "/api/auth/login",
                method: "POST",
                headers: {
                    Cookie: cookie,
                },
                data: {
                    email: "loggedin@email.com",
                    password: "Abc-1234",
                },
            });
            expect(response.status).toBe(401);
        });
    });

    // Validation Tests:
    describe("user login validation test : ", () => {
        let loginData: LoginData;

        beforeEach(() => {
            loginData = fkLoginData();
        });

        test.each([
            { missingFieldName: "email" },
            { missingFieldName: "password" },
        ])(
            "respond with 400 Bad Request when $missingFieldName field is missing",
            async ({ missingFieldName }) => {
                delete loginData[missingFieldName as keyof typeof loginData];

                const response = await axios.post("api/auth/login", loginData);

                expect(response.status).toBe(400);
            }
        );

        test("respond with 400 Bad Request when req.body contains unexpected data", async () => {
            const response = await axios.post("/api/auth/login", {
                ...loginData,
                unexpectedKey: "unexpected value",
            });
        });

        // One validation test for each field is enough to verify that the validation schema
        // contains the required generic fields. These have been tested thoroughly in the
        // registration route tests

        // Email validation tests
        test("return 400 when email is invalid", async () => {
            // No domain
            loginData.email = "awesome@awesome";

            const response = await axios.post("api/auth/login", loginData);
            expect(response.status).toBe(400);
        });

        // Password validation tests
        test("return 400 when password is too short", async () => {
            loginData.password = "123";

            const response = await axios.post("api/auth/login", loginData);
            expect(response.status).toBe(400);
        });
    });

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
