import app from "../app";
import db from "../models/db";
import axios from "axios";
import { prisma } from "../models/prisma";
import { faker } from "@faker-js/faker";

// Import TypeScript types
import { Express } from "express"; // Types for Express
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { Server } from "http";
import { AxiosResponse } from "axios";
import { RegistrationData, UserWithoutPassword } from "../models/userModel";
import { PostData, PostWithRelations } from "../models/postModel";
import { Post, Status, Category } from ".prisma/client";

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

    // VALIDATION TESTS [400]:
    // Prevent registration if fields missing
    // Reject invalid inputs
    // Reject unexpected attributes
    // Others
    // user validation test
    describe("user validation test : ", () => {
        test.each([
            { missingFieldName: "userName" },
            { missingFieldName: "email" },
            { missingFieldName: "password" },
        ])(
            "return 400 when $missingFieldName field is missing",
            async ({ missingFieldName }) => {
                const user: RegistrationData = createRandomUserForRegister();

                delete user[missingFieldName as keyof typeof user];

                const response = await axios.post("api/auth/register", user);

                expect(response.status).toBe(400);
            }
        );

        // username validation test
        test("return 400 when username is too short", async () => {
            const user: RegistrationData = {
                ...createRandomUserForRegister(),
                userName: "awe",
            };

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        test("return 400 when username is too long", async () => {
            const user: RegistrationData = {
                ...createRandomUserForRegister(),
                userName: "awe1234567890awesome",
            };

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        test("return 400 when username has invalid special charactors", async () => {
            const user: RegistrationData = {
                ...createRandomUserForRegister(),
                userName: "awesome*",
            };

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        test("return 400 when username has consecutive (-) (_) (.)) charactors", async () => {
            const user: RegistrationData = {
                ...createRandomUserForRegister(),
                userName: "awe__some",
            };

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        test("return 400 when username starts with a special charactor", async () => {
            const user: RegistrationData = {
                ...createRandomUserForRegister(),
                userName: "_awesome",
            };

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        // email validation test
        test("return 400 when email is invalid", async () => {
            {
                const user: RegistrationData = {
                    ...createRandomUserForRegister(),
                    email: "awesome@awesome",
                };

                const response = await axios.post("api/auth/register", user);
                expect(response.status).toBe(400);
            }

            {
                const user: RegistrationData = {
                    ...createRandomUserForRegister(),
                    email: "awesome.com",
                };

                const response = await axios.post("api/auth/register", user);
                expect(response.status).toBe(400);
            }

            {
                const user: RegistrationData = {
                    ...createRandomUserForRegister(),
                    email: ".awe@some.com",
                };

                const response = await axios.post("api/auth/register", user);
                expect(response.status).toBe(400);
            }
        });

        // password validation test
        test("return 400 when password is invalid", async () => {
            const user: RegistrationData = {
                ...createRandomUserForRegister(),
                password: "123",
            };

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        test("return 400 when password is too long", async () => {
            const user: RegistrationData = {
                ...createRandomUserForRegister(),
                password: "!Aa0123123Awesome",
            };

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        test("return 400 when password is not included at least one lower case", async () => {
            const user: RegistrationData = {
                ...createRandomUserForRegister(),
                password: "!A0123AWESOME",
            };

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        test("return 400 when password is not included at least one upper case", async () => {
            const user: RegistrationData = {
                ...createRandomUserForRegister(),
                password: "!a0123awesome",
            };

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        test("return 400 when password is not included at least one number", async () => {
            const user: RegistrationData = {
                ...createRandomUserForRegister(),
                password: "!Aawesome",
            };

            const response = await axios.post("api/auth/register", user);
            expect(response.status).toBe(400);
        });

        test("return 400 when password is not included at least one special charactor", async () => {
            const user: RegistrationData = {
                ...createRandomUserForRegister(),
                password: "Aa01wesome",
            };

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

            // Try to login again when logged in
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

    // Validation Tests [400]:
    describe("user login validation test : ", () => {
        test.each([
            { missingFieldName: "email" },
            { missingFieldName: "password" },
        ])(
            "return 400 when $missingFieldName field is missing",
            async ({ missingFieldName }) => {
                const user: LoginData = createRandomUserForLogin();

                delete user[missingFieldName as keyof typeof user];

                const response = await axios.post("api/auth/login", user);

                expect(response.status).toBe(400);
            }
        );

        test("return 400 when password is too short", async () => {
            const user: LoginData = {
                ...createRandomUserForLogin(),
                password: "123",
            };

            const response = await axios.post("api/auth/login", user);
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

    // User update route handler
    // -------------------------------------------------------------------------
    describe("/api/user/update", () => {
        test("User is able to update their user data", async () => {
            // Create a user
            const initialUser = await axios.post("api/auth/register", {
                userName: "Achilles",
                email: "achilles@email.com",
                password: "Abc-1234",
            });
            expect(await db.user.count()).toBe(1);

            // Login the new user
            const response = await axios.post("/api/auth/login", {
                email: "achilles@email.com",
                password: "Abc-1234",
            });
            expect(response.status).toBe(200);
            expect(response.data.data.id).toBeDefined();

            // Get session cookie
            if (!response.headers["set-cookie"]) {
                throw new Error("No cookie returned");
            }
            const cookie: string = response.headers["set-cookie"][0];
            // Update our user
            const updatedUser = await axios.put(
                "/api/user/update",
                {
                    userName: "Homer",
                    email: "homer@gmail.com",
                    password: "Abc-1234",
                },
                { headers: { Cookie: cookie } }
            );
            expect(updatedUser.status).toBe(201);
            expect(initialUser.data.data.id).toBe(updatedUser.data.data.id);
            expect(updatedUser.data.data.userName).toBe("Homer");
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
            if (!response.headers["set-cookie"]) {
                throw new Error("No cookie returned");
            }
            const cookie: string = response.headers["set-cookie"][0];

            // Update our user
            const updatedUser = await axios.put(
                "/api/user/update",
                {
                    userName: "Penelope",
                    email: "odysseus@gmail.com",
                    password: "Password1!",
                },
                { headers: { Cookie: cookie } }
            );
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
            if (!response.headers["set-cookie"]) {
                throw new Error("No cookie returned");
            }
            const cookie: string = response.headers["set-cookie"][0];

            // Update our user
            const updatedUser = await axios.put(
                "/api/user/update",
                {
                    userName: "Hercules",
                    email: "eurycleia@email.com",
                    password: "Password1!",
                },
                { headers: { Cookie: cookie } }
            );
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
            expect(updatedUser.status).toBe(401);
        });
    });
});

// Post route handler integration tests
// -------------------------------------------------------------------------
describe("Integration tests for POST routes:", () => {
    describe("/api/posts/create", () => {
        test("responds with 201 Created and returns the created post", async () => {
            // Create a user first
            await axios.post("/api/auth/register", {
                userName: "postUser",
                email: "post@email.com",
                password: "Abc-1234",
            });
            expect(await db.user.count()).toBe(1);

            // Log the user in
            const loginResponse = await axios.post("/api/auth/login", {
                email: "post@email.com",
                password: "Abc-1234",
            });
            expect(loginResponse.status).toBe(200);

            // Get session cookie
            if (!loginResponse.headers["set-cookie"])
                throw new Error("No cookie set");
            const cookie: string = loginResponse.headers["set-cookie"][0];

            // Create some tags in the database
            await db.tag.createMany({
                data: [...possibleTags.map((t) => ({ name: t }))],
            });
            expect(await db.tag.count()).toBe(6);

            const response = await axios({
                url: "/api/posts/create",
                method: "POST",
                headers: {
                    Cookie: cookie,
                },
                data: {
                    title: "test",
                    content: "test",
                    status: "DRAFT",
                    category: "GENERAL",
                    postTags: ["JS"],
                },
            });
            expect(response.status).toBe(201);
        });

        test("responds with 401 Unauthorised when not logged in", async () => {
            const response = await axios.post("/api/posts/create", {
                title: "test",
                content: "test",
                status: "DRAFT",
                category: "GENERAL",
                postTags: ["JS"],
            });
            expect(response.status).toBe(401);
        });
        // returns 400 error with invalid inputs - validation tests
    });

    describe("/api/posts/getPostById", () => {
        test("responds with 200 ok and the post with comments, likes and tags with valid inputs", async () => {
            // Create a user
            const user = await axios.post("/api/auth/register", {
                userName: "getPostByIdUser",
                email: "post@email.com",
                password: "Abc-1234",
            });
            expect(await db.user.count()).toBe(1);

            // Create some tags in the database
            await db.tag.createMany({
                data: [...possibleTags.map((t) => ({ name: t }))],
            });
            expect(await db.tag.count()).toBe(6);

            // Create a post in the database
            const post = await db.post.createPost({
                userId: user?.data?.data?.id,
                title: "test",
                content: "test",
                status: "DRAFT",
                category: "GENERAL",
                postTags: ["JS"],
            });
            expect(await db.post.count()).toBe(1);

            const response = await axios.post("/api/posts/getPostById", {
                postId: post?.id,
            });
            expect(response.status).toBe(200);
            expect(response.data.data.id).toBe(post?.id);
            expect(response.data.data.postTags[0].tag.name).toBe("JS");
        });

        test("responds with 400 Bad Request when post not in database", async () => {
            // Don't create a post in the database for this test
            const response = await axios.post("/api/posts/getPostById", {
                postId: "5e8f8f8f8f8f8f8f8f8f8f8",
            });
            expect(response.status).toBe(400);
        });

        // Tests for get post by id
        // validation tests 400 error with invalid inputs
        // TODO: check that comments and likes are present in 200 OK test
    });

    describe("/api/posts/deletePost", () => {
        test("responds with 200 OK and the deleted post if successful", async () => {
            // Create a user
            const user = await axios.post("/api/auth/register", {
                userName: "deletepostUser",
                email: "delete@email.com",
                password: "Abc-1234",
            });
            expect(await db.user.count()).toBe(1);

            // Log the user in
            const loginResponse = await axios.post("/api/auth/login", {
                email: "delete@email.com",
                password: "Abc-1234",
            });
            expect(loginResponse.status).toBe(200);

            // Get session cookie
            if (!loginResponse.headers["set-cookie"])
                throw new Error("No cookie set");
            const cookie: string = loginResponse.headers["set-cookie"][0];

            // Create some tags in the database
            await db.tag.createMany({
                data: [...possibleTags.map((t) => ({ name: t }))],
            });
            expect(await db.tag.count()).toBe(6);

            // Create a post in the database
            const post = await db.post.createPost({
                userId: user?.data?.data?.id,
                title: "test",
                content: "test",
                status: "DRAFT",
                category: "GENERAL",
                postTags: ["JS"],
            });
            expect(await db.post.count()).toBe(1);

            // Delete the post
            const response = await axios({
                url: `/api/posts/deletePost/${post?.id}`,
                method: "DELETE",
                headers: {
                    Cookie: cookie,
                },
            });
            expect(response.status).toBe(200);
            expect(response.data.data.id).toBe(post?.id);
            expect(await db.post.count()).toBe(0);
        });

        test("responds with 400 Bad Request when post not in database", async () => {
            // Don't create a post for this test

            // Create a user
            await axios.post("/api/auth/register", {
                userName: "deletepostUser",
                email: "delete@email.com",
                password: "Abc-1234",
            });
            expect(await db.user.count()).toBe(1);

            // Log the user in
            const loginResponse = await axios.post("/api/auth/login", {
                email: "delete@email.com",
                password: "Abc-1234",
            });
            expect(loginResponse.status).toBe(200);

            // Get session cookie
            if (!loginResponse.headers["set-cookie"])
                throw new Error("No cookie set");
            const cookie: string = loginResponse.headers["set-cookie"][0];

            // Delete the post
            const response = await axios({
                url: "/api/posts/deletePost/5e8f8f8f8f8f8f8f8f8f8f8",
                method: "DELETE",
                headers: {
                    Cookie: cookie,
                },
            });
            expect(response.status).toBe(400);
        });

        test("responds with 401 Unauthorized when not logged in", async () => {
            // No logged in user for this test
            // No need to create a post for this test as it should fail before the post is needed

            const response = await axios.delete(
                "/api/posts/deletePost/5e8f8f8f8f8f8f8f8f8f8f8"
            );
            expect(response.status).toBe(401);
        });
    });

    describe("/api/posts/update", () => {
        let user: UserWithoutPassword;
        let cookie: string;
        beforeEach(async () => {
            // Create a user
            const userResponse: AxiosResponse = await axios.post(
                "/api/auth/register",
                {
                    userName: "updatePostUser",
                    email: "user@email.com",
                    password: "Abc-1234",
                }
            );
            user = userResponse.data.data;
            expect(await db.user.count()).toBe(1);

            // Log the user in
            const loginResponse = await axios.post("/api/auth/login", {
                email: "user@email.com",
                password: "Abc-1234",
            });
            expect(loginResponse.status).toBe(200);

            // Get the session cookie
            if (!loginResponse.headers["set-cookie"]) {
                throw new Error("No cookie set");
            }
            cookie = loginResponse.headers["set-cookie"][0];

            // Create some tags in the database
            await db.tag.createMany({
                data: [...possibleTags.map((t) => ({ name: t }))],
            });
            expect(await db.tag.count()).toBe(6);
        });

        test("responds with 200 OK and updated post, tags, likes and comments with valid data", async () => {
            // Create a post in the database
            const post = await db.post.createPost({
                userId: user?.id,
                title: "test",
                content: "test",
                status: "DRAFT",
                category: "GENERAL",
                postTags: ["JS"],
            });
            expect(await db.post.count()).toBe(1);

            // Update the post
            const response = await axios({
                url: "/api/posts/update",
                method: "POST",
                headers: {
                    Cookie: cookie,
                },
                data: {
                    postId: post?.id,
                    updatedData: {
                        userId: user?.id,
                        title: "test",
                        content: "test",
                        status: "PUBLISHED",
                        category: "GENERAL",
                        postTags: ["JS"],
                    },
                },
            });
            expect(response.status).toBe(200);
            expect(response.data.data.status).toBe("PUBLISHED");
        });

        test("responds with 400 Bad Request when post doesn't exist in the database", async () => {
            // Don't create a post in the database for this test

            const response = await axios({
                url: "/api/posts/update",
                method: "POST",
                headers: {
                    Cookie: cookie,
                },
                data: {
                    postId: "5e8f8f8f8f8f8f8f8f8f8f8",
                    updatedData: {
                        userId: user?.id,
                        title: "test",
                        content: "test",
                        status: "DRAFT",
                        category: "GENERAL",
                        postTags: ["JS", "TS"],
                    },
                },
            });
            expect(response.status).toBe(400);
        });

        test("responds with 401 Unauthorised when not logged in", async () => {
            // Don't log in for this test

            // Don't need input data for this test as it should respond before the controller is called
            const response = await axios.post("/api/posts/update");
            expect(response.status).toBe(401);
        });

        test("responds with 403 Forbidden when the user is not the author of the post", async () => {
            // Create a different user
            const user2 = await axios.post("/api/auth/register", {
                userName: "postuser",
                email: "user2@email.com",
                password: "Abc-1234",
            });
            expect(await db.user.count()).toBe(2);

            // Create a post in the database
            const post = await db.post.createPost({
                userId: user2.data.data.id,
                title: "test",
                content: "test",
                status: "DRAFT",
                category: "GENERAL",
                postTags: ["JS"],
            });
            expect(await db.post.count()).toBe(1);

            // Update the post
            const response = await axios({
                url: "/api/posts/update",
                method: "POST",
                headers: {
                    Cookie: cookie,
                },
                data: {
                    postId: post?.id,
                    updatedData: {
                        userId: post?.userId,
                        title: "test",
                        content: "test",
                        status: "PUBLISHED",
                        category: "GENERAL",
                        postTags: ["JS"],
                    },
                },
            });
            expect(response.status).toBe(403);
        });

        // Tests for update post
        // 400 Bad Request - Validation tests
    });

    describe("/api/posts/searchPublished", () => {
        let searchPosts: (PostWithRelations | null)[];
        let user: UserWithoutPassword;

        beforeEach(async () => {
            // Create a user
            const userResponse: AxiosResponse = await axios.post(
                "/api/auth/register",
                {
                    userName: "updatePostUser",
                    email: "user@email.com",
                    password: "Abc-1234",
                }
            );
            user = userResponse.data.data;
            expect(await db.user.count()).toBe(1);

            // Create some tags in the database
            await db.tag.createMany({
                data: [...possibleTags.map((t) => ({ name: t }))],
            });
            expect(await db.tag.count()).toBe(6);

            const data = [
                {
                    userId: user.id,
                    title: "Using JavaScript with GraphQL",
                    category: "LEARN" as Category,
                    status: "PUBLISHED" as Status,
                    postTags: ["JS", "GraphQL"],
                    createdDate: new Date("2022-08-23T06:37:41.054Z"),
                },
                {
                    userId: user.id,
                    title: "Is JavaScript better than Java?",
                    category: "GENERAL" as Category,
                    status: "PUBLISHED" as Status,
                    postTags: ["JS", "Java"],
                    createdDate: new Date("2022-08-23T06:37:42.054Z"),
                },
                {
                    userId: user.id,
                    title: "React Developer at NTT",
                    category: "INTERVIEW" as Category,
                    status: "PUBLISHED" as Status,
                    postTags: ["React"],
                    createdDate: new Date("2022-08-23T06:37:43.054Z"),
                },
                {
                    userId: user.id,
                    title: "TypeScript is the future",
                    category: "LEARN" as Category,
                    status: "PUBLISHED" as Status,
                    postTags: ["JS", "TS"],
                    createdDate: new Date("2022-08-23T06:37:44.054Z"),
                },
                {
                    userId: user.id,
                    title: "Polymorphism in Java",
                    category: "LEARN" as Category,
                    status: "PUBLISHED" as Status,
                    postTags: ["Java"],
                    createdDate: new Date("2022-08-23T06:37:45.054Z"),
                },
                {
                    userId: user.id,
                    title: "Draft post",
                    category: "LEARN" as Category,
                    status: "DRAFT" as Status,
                    postTags: ["JS", "TS"],
                    createdDate: new Date("2022-08-23T06:37:46.054Z"),
                },
            ];

            // Create posts in the database
            searchPosts = await Promise.all(
                data.map(async (p) => {
                    return db.post.createPost(fkPostData(p));
                })
            );
        });

        test("responds with 200 OK and all PUBLISHED posts with no inputs", async () => {
            const response = await axios.post(
                "/api/posts/searchPublishedPosts"
            );
            expect(response.status).toBe(200);
            expect(response.data.data.length).toBe(5);
        });

        test("responds with 200 OK and posts with 'React' tag", async () => {
            const response = await axios.post(
                "/api/posts/searchPublishedPosts",
                {
                    tags: ["React"],
                }
            );
            expect(response.status).toBe(200);
            expect(response.data.data.length).toBe(1);
        });

        test("responds with 200 OK and posts with 'React' and 'TS' tags", async () => {
            const response = await axios.post(
                "/api/posts/searchPublishedPosts",
                {
                    tags: ["React", "TS"],
                }
            );
            expect(response.status).toBe(200);
            expect(response.data.data.length).toBe(2);
        });

        test("responds with 200 OK and PUBLISHED posts from the 'LEARN' category", async () => {
            const response = await axios.post(
                "/api/posts/searchPublishedPosts",
                {
                    category: "LEARN",
                }
            );
            expect(response.status).toBe(200);
            expect(response.data.data.length).toBe(3);
        });

        test("responds with 200 OK and PUBLISHED posts matching the searched title", async () => {
            const response = await axios.post(
                "/api/posts/searchPublishedPosts",
                {
                    title: "JavaScript",
                }
            );
            expect(response.status).toBe(200);
            expect(response.data.data.length).toBe(2);

            const response2 = await axios.post(
                "/api/posts/searchPublishedPosts",
                {
                    title: "Using JavaScript",
                }
            );
            expect(response2.status).toBe(200);
            expect(response2.data.data.length).toBe(1);
        });

        test("responds with 200 OK and posts sorted by date DESC by default", async () => {
            const response = await axios.post(
                "/api/posts/searchPublishedPosts"
            );
            expect(response.status).toBe(200);
            expect(response.data.data).toHaveLength(5);

            // Check that date at post index i > date at post index i + 1
            response.data.data.forEach((p: Post, i: number) => {
                if (response.data.data[i + 1]) {
                    expect(
                        p.createdDate >
                            (response.data.data[i + 1]?.createdDate as Date)
                    ).toBe(true);
                }
            });
        });

        test("responds with 200 OK and posts sorted by number of likes DESC", async () => {
            // Create 5 users to generate likes for the posts
            const users = await Promise.all(
                Array.from({ length: 5 }, () =>
                    db.user.register(createRandomUserForRegister())
                )
            );
            expect(await prisma.user.count()).toBe(6);

            // Add likes to the posts
            await Promise.all(
                searchPosts.map(async (p, index) => {
                    // Make TypeScript happy - rule out undefined values
                    if (!p) return;

                    // Build a list of likes for the post
                    const likes = [];
                    for (let i = 0; i < index; i++) {
                        likes.push({
                            userId: users[i].id,
                            postId: p.id,
                        });
                    }

                    // Add the likes to the database
                    await prisma.likes.createMany({
                        data: likes,
                    });
                })
            );
            expect(await prisma.likes.count()).toBe(15);

            // Request posts with sort flag
            const response = await axios.post(
                "/api/posts/searchPublishedPosts",
                {
                    sortBy: "likes",
                }
            );
            expect(response.status).toBe(200);
            expect(response.data.data).toHaveLength(5);

            // Check that number of likes at post index i > date at post index i + 1
            response.data.data.forEach((p: PostWithRelations, i: number) => {
                // Check that each post has more likes than the next post
                // The conditional prevents checking the last post as it has nothing
                // to compare to
                if (response.data.data[i + 1]) {
                    expect(p.likes.length).toBeGreaterThan(
                        response.data.data[i + 1]?.likes.length
                    );
                }
            });
        });

        test("responds with 404 Not Found when no matching posts exist in the database", async () => {
            const response = await axios.post(
                "/api/posts/searchPublishedPosts",
                {
                    title: "Haskell",
                }
            );
            expect(response.status).toBe(404);
        });
    });

    // 400 Bad Request - Validation tests
});

// TODO
// Refactor - remove duplicate code for setting up tags etc.
// Extract route integration tests to separate files

// Faker
// -------------------------------------------------------------------------

function createRandomUserForRegister(): RegistrationData {
    return {
        userName: faker.internet.userName(),
        email: faker.internet.email(),
        password: faker.internet.password(10, false, /\w/, "!Aa0"),
    };
}

interface LoginData {
    email: string;
    password: string;
}

function createRandomUserForLogin(): LoginData {
    return {
        email: faker.internet.email(),
        password: faker.internet.password(10, false, /\w/, "!Aa0"),
    };
}

const possibleTags = ["JS", "TS", "GraphQL", "React", "Vue", "Java"];

/**
 * ### fkPostData()
 *
 * Generates a random set of data to be used to create a post
 * userId must be provided in the params object for the post to be created.
 * All other fields are optional and will be generated randomly. If a field is
 * provided in the params object, that value will be used instead of a random
 * value.
 *
 * @param {Partial<PostData>} params - An object with data to be used to create a post
 *
 * @returns {PostData} An object with random data to be used to create a post
 *
 * #### Examples:
 * ##### Generate a post with random data
 * ```
 * const postData = fkPostData({
 *   userId: user.id,
 * });
 * ```
 */
const fkPostData = (params: Partial<PostData>): PostData => {
    return {
        userId: params?.userId as string,
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(4),
        status: faker.helpers.arrayElement(["DRAFT", "PUBLISHED"]),
        category: faker.helpers.arrayElement([
            "GENERAL",
            "LEARN",
            "INTERVIEW",
            "PROJECT",
        ]),
        postTags: faker.helpers.arrayElements(possibleTags),
        ...params,
    };
};
