import "./testSetup";
import db from "../models/db";
import axios from "axios";
import { prisma } from "../models/prisma";
import { possibleTags, fkRegistrationData, fkPostData } from "./faker";

// Import TypeScript types
import { AxiosResponse } from "axios";
import { UserWithoutPassword } from "../models/userModel";
import { PostWithRelations } from "../models/postModel";
import { Post, Status, Category } from ".prisma/client";

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
