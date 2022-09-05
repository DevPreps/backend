import "./testSetup";
import axios from "axios";
import crypto from "crypto";
import db from "../models/db";
import { prisma } from "../models/prisma";
import {
    possibleTags,
    possiblePositions,
    fkRegistrationData,
    fkPostData,
} from "./faker";

// Import TypeScript types
import { AxiosResponse } from "axios";
import { UserWithoutPassword } from "../models/userModel";
import { PostWithRelations } from "../models/postModel";
import { Post, Status, Category } from ".prisma/client";

// Post route handler integration tests
// -------------------------------------------------------------------------
describe("Integration tests for POST routes:", () => {
    describe("/api/posts/create", () => {
        beforeEach(async () => {
            await db.position.createMany({
                data: [...possiblePositions.map((t) => ({ positionTitle: t }))],
            });
            expect(await db.position.count()).toBe(4);
        });

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

        // Validation tests
        describe("Validation:", () => {
            let user: UserWithoutPassword;
            let cookie: string;

            beforeEach(async () => {
                // Create a user first
                user = await axios.post("/api/auth/register", {
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
                cookie = loginResponse.headers["set-cookie"][0];

                // Create some tags in the database
                await db.tag.createMany({
                    data: [...possibleTags.map((t) => ({ name: t }))],
                });
                expect(await db.tag.count()).toBe(6);
            });

            test.each([
                { missingField: "title" },
                { missingField: "content" },
                { missingField: "status" },
                { missingField: "category" },
                { missingField: "postTags" },
            ])(
                "responds with 400 Bad Request when $missingField is missing from the request body",
                async ({ missingField }) => {
                    const post = {
                        title: "test",
                        content: "test",
                        status: "DRAFT",
                        category: "GENERAL",
                        postTags: ["JS"],
                    };
                    delete post[missingField as keyof typeof post];

                    const response = await axios.post(
                        "/api/posts/create",
                        post,
                        {
                            headers: { Cookie: cookie },
                        }
                    );
                    expect(response.status).toBe(400);
                }
            );

            // Test that all possible expected keys pass validation
            test("responds with 201 Created when request body only contains valid fields", async () => {
                // This test confirms that none of the valid fields (including optional fields)
                // are considered to be unexpected fields by the validation schema
                const post = {
                    title: "test",
                    content: "test",
                    status: "DRAFT",
                    category: "GENERAL",
                    postTags: ["JS"],
                    companyName: "Test Company",
                    city: "Brisbane",
                    jobTitle: "Junior JavaScript Developer",
                    position: "Frontend Developer",
                    jobAdUrl: "https://seek.com.au/jobs/876876",
                };

                const response = await axios.post("/api/posts/create", post, {
                    headers: { Cookie: cookie },
                });
                expect(response.status).toBe(201);
            });

            // Ensure no unexpected keys are accepted
            test("responds with 400 Bad Request when request body contains unexpected fields", async () => {
                const post = {
                    title: "test",
                    content: "test",
                    status: "DRAFT",
                    category: "GENERAL",
                    postTags: ["JS"],
                    companyName: "Test Company",
                    city: "Brisbane",
                    jobTitle: "Junior JavaScript Developer",
                    position: "Frontend Developer",
                    jobAdUrl: "https://seek.com.au/jobs/876876",
                    unexpectedKey: "unexpected value",
                };

                const response = await axios.post("/api/posts/create", post, {
                    headers: { Cookie: cookie },
                });
                expect(response.status).toBe(400);
            });

            // Title
            test.each([
                { title: "abc", condition: "too short" },
                {
                    title: `${crypto.randomBytes(126).toString("hex")}`,
                    condition: "too long",
                },
            ])(
                "responds with 400 Bad Request when title is $condition",
                async ({ title }) => {
                    const post = fkPostData({
                        userId: user.id,
                        title: title,
                    });

                    const response = await axios.post(
                        "/api/posts/create",
                        post,
                        {
                            headers: {
                                Cookie: cookie,
                            },
                        }
                    );
                    expect(response.status).toBe(400);
                }
            );

            // Content
            test("responds with 400 Bad Request when content is too long", async () => {
                // No need to test for short content. The required flag will prevent empty strings.
                const post = fkPostData({
                    userId: user.id,
                    content: `${crypto.randomBytes(5001).toString("hex")}`, // 10002 characters
                });

                const response = await axios.post("/api/posts/create", post, {
                    headers: {
                        Cookie: cookie,
                    },
                });
                expect(response.status).toBe(400);
            });

            // Category
            test.each([
                { category: "GENERAL", condition: "general" },
                { category: "LEARN", condition: "learn" },
                { category: "INTERVIEW", condition: "interview" },
                { category: "PROJECT", condition: "project" },
            ])(
                "responds with 201 Created when category is $condition",
                async ({ category }) => {
                    const post = fkPostData({
                        userId: user.id,
                        category: category as Category,
                    });

                    const response = await axios.post(
                        "/api/posts/create",
                        post,
                        {
                            headers: {
                                Cookie: cookie,
                            },
                        }
                    );
                    expect(response.status).toBe(201);
                }
            );

            test("responds with 400 Bad Request when category is not one of the accepted values", async () => {
                // Can't use faker as TypeScript will complain
                const post = {
                    title: "test",
                    content: "test",
                    status: "DRAFT",
                    postTags: ["JS"],
                    category: "not an accepted value",
                };

                const response = await axios.post("/api/posts/create", post, {
                    headers: {
                        Cookie: cookie,
                    },
                });
                expect(response.status).toBe(400);
            });

            // Status
            test("responds with 400 Bad Request when status is not one of the accepted values", async () => {
                const post = {
                    title: "test",
                    content: "test",
                    status: "not an accepted value",
                    category: "GENERAL",
                    postTags: ["JS"],
                };

                const response = await axios.post("/api/posts/create", post, {
                    headers: {
                        Cookie: cookie,
                    },
                });
                expect(response.status).toBe(400);
            });

            test.each([{ status: "PUBLISHED" }, { status: "DRAFT" }])(
                "responds with 201 Created when status is $status",
                async ({ status }) => {
                    const post = fkPostData({
                        userId: user.id,
                        status: status as Status,
                    });

                    const response = await axios.post(
                        "/api/posts/create",
                        post,
                        {
                            headers: {
                                Cookie: cookie,
                            },
                        }
                    );
                    expect(response.status).toBe(201);
                }
            );

            // Company name
            test.each([
                { companyName: {}, condition: "not a string" },
                { companyName: "a", condition: "too short" },
                {
                    companyName: `${crypto.randomBytes(126).toString("hex")}`,
                    condition: "too long",
                },
            ])(
                "responds with 400 Bad request when companyName is $condition",
                async ({ companyName }) => {
                    const post = {
                        title: "test",
                        content: "test",
                        status: "PUBLISHED",
                        category: "GENERAL",
                        postTags: ["JS"],
                        companyName: companyName,
                    };

                    const response = await axios.post(
                        "/api/posts/create",
                        post,
                        {
                            headers: {
                                Cookie: cookie,
                            },
                        }
                    );
                    expect(response.status).toBe(400);
                }
            );

            // City
            test.each([
                { city: {}, condition: "not a string" },
                { city: "a", condition: "too short" },
                {
                    city: `${crypto.randomBytes(51).toString("hex")}`,
                    condition: "too long",
                },
            ])(
                "responds with 400 Bad Request when city is $condition",
                async ({ city }) => {
                    const post = {
                        title: "test",
                        content: "test",
                        status: "PUBLISHED",
                        category: "GENERAL",
                        postTags: ["JS"],
                        city: city,
                    };

                    const response = await axios.post(
                        "/api/posts/create",
                        post,
                        {
                            headers: {
                                Cookie: cookie,
                            },
                        }
                    );
                    expect(response.status).toBe(400);
                }
            );

            // Job title
            test.each([
                { jobTitle: {}, condition: "not a string" },
                { jobTitle: "ace", condition: "too short" },
                {
                    jobTitle: `${crypto.randomBytes(126).toString("hex")}`,
                    condition: "too long",
                },
            ])(
                "responds with 400 Bad Request when jobTitle is $condition",
                async ({ jobTitle }) => {
                    const post = {
                        title: "test",
                        content: "test",
                        status: "PUBLISHED",
                        category: "GENERAL",
                        postTags: ["JS"],
                        jobTitle: jobTitle,
                    };

                    const response = await axios.post(
                        "/api/posts/create",
                        post,
                        {
                            headers: {
                                Cookie: cookie,
                            },
                        }
                    );
                    expect(response.status).toBe(400);
                }
            );

            // Position
            test.each([
                { position: {}, condition: "not a string" },
                {
                    position: "not a position",
                    condition: "not in the database",
                },
            ])(
                "responds with 400 Bad Request when position is $condition",
                async ({ position }) => {
                    const post = {
                        title: "test",
                        content: "test",
                        status: "PUBLISHED",
                        category: "GENERAL",
                        postTags: ["JS"],
                        position: position,
                    };

                    const response = await axios.post(
                        "/api/posts/create",
                        post,
                        {
                            headers: {
                                Cookie: cookie,
                            },
                        }
                    );
                    expect(response.status).toBe(400);
                }
            );

            // Job Ad Url
            test.each([
                { jobAdUrl: {}, condition: "not a string" },
                { jobAdUrl: "not a valid URL", condition: "not a valid URL" },
            ])(
                "responds with 400 Bad Request when jobAdUrl is $condition",
                async ({ jobAdUrl }) => {
                    const post = {
                        title: "test",
                        content: "test",
                        status: "PUBLISHED",
                        category: "GENERAL",
                        postTags: ["JS"],
                        jobAdUrl: jobAdUrl,
                    };

                    const response = await axios.post(
                        "/api/posts/create",
                        post,
                        {
                            headers: {
                                Cookie: cookie,
                            },
                        }
                    );
                    expect(response.status).toBe(400);
                }
            );

            // PostTags
            test("responds with 400 Bad Request if postTags does not contain at least one value", async () => {
                const post = fkPostData({
                    userId: user.id,
                    postTags: [],
                });

                const response = await axios.post("/api/posts/create", post, {
                    headers: {
                        Cookie: cookie,
                    },
                });
                expect(response.status).toBe(400);
            });

            test("responds with 400 Bad Request when postTags contain non-string values", async () => {
                // Can't use faker as TypeScript will throw an error
                const post = {
                    title: "test",
                    content: "test",
                    status: "PUBLISHED",
                    category: "GENERAL",
                    postTags: [{}],
                };

                const response = await axios.post("/api/posts/create", post, {
                    headers: {
                        Cookie: cookie,
                    },
                });
                expect(response.status).toBe(400);
            });

            test("responds with 400 Bad Request when postTags are not one of the accepted values", async () => {
                const post = fkPostData({
                    userId: user.id,
                    postTags: ["C++"],
                });

                const response = await axios.post("/api/posts/create", post, {
                    headers: {
                        Cookie: cookie,
                    },
                });
                expect(response.status).toBe(400);
            });
        });
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
                    db.user.register(fkRegistrationData())
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
