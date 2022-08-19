import db from "../db";
import { prisma } from "../prisma";

// Import TypeScript types
import { UserWithoutPassword } from "../../models/userModel";

jest.mock("../prisma");

const posts = db.post;

describe("Unit Tests for Post Model:", () => {
    test("returns an object which contains prisma post functions", () => {
        expect(posts.count).toBeDefined();
        expect(posts.findMany).toBeDefined();
    });

    test("returns an object with custom methods", () => {
        expect(posts.create).toBeDefined();
        expect(posts.getPostById).toBeDefined();
    });

    describe("Custom Methods:", () => {
        let user: UserWithoutPassword;

        beforeEach(async () => {
            // Note: There is no need to clear the database between tests as the
            // prisma mock already does this
            // Create a user in the database
            user = await db.user.register({
                userName: "test",
                email: "test@email.com",
                password: "testPassword",
            });
            expect(await db.user.count()).toBe(1);

            // Create some tags in the database
            await db.tag.createMany({
                data: [
                    { name: "JS" },
                    { name: "TS" },
                    { name: "GraphQL" },
                    { name: "React" },
                    { name: "Vue" },
                    { name: "Java" },
                ],
            });
            expect(await db.tag.count()).toBe(6);
        });

        // Create post
        // -------------------------------------------------------------------------
        test("post.create creates a new post in the database", async () => {
            expect(await posts.count()).toBe(0);

            await posts.createPost({
                userId: user.id,
                title: "test",
                content: "test",
                status: "DRAFT",
                category: "GENERAL",
                postTags: ["JS", "TS"],
            });
            expect(await posts.count()).toBe(1);

            const result = await posts.findFirst({
                where: {
                    userId: user.id,
                },
                include: {
                    postTags: {
                        include: {
                            tag: true,
                        },
                    },
                },
            });
            expect(result?.postTags.length).toBe(2);
        });

        // Get post by id
        // -------------------------------------------------------------------------
        test("post.getPostById returns the correct post with associated tags, comments and likes", async () => {
            expect(await posts.count()).toBe(0);

            // Create some posts in the database
            const post1 = await posts.createPost({
                userId: user.id,
                title: "test",
                content: "test",
                status: "PUBLISHED",
                category: "GENERAL",
                postTags: ["Vue", "Java"],
            });

            const post2 = await posts.createPost({
                userId: user.id,
                title: "test",
                content: "test",
                status: "PUBLISHED",
                category: "GENERAL",
                postTags: ["JS", "TS"],
            });
            expect(await posts.count()).toBe(2);
            expect(post1?.id).not.toEqual(post2?.id);

            // Get post1 by id
            const result = await posts.getPostById(post1?.id as string);
            expect(result?.id).toBe(post1?.id);

            // Check that tags are included
            expect(result?.postTags.length).toBe(2);
            expect(result?.comments.length).toBe(0);
            expect(result?.likes.length).toBe(0);
        });

        test("post.getpostById returns null if the post does not exist", async () => {
            // Don't create any posts in the database for this test
            expect(await posts.count()).toBe(0);

            // Try to get a post by id
            const result = await posts.getPostById("not-a-valid-id");
            expect(result).toBeNull();
        });

        // TODO:
        // Should return all related comments
        // Should return all related likes

        // Delete post
        // -------------------------------------------------------------------------
        describe("Delete Post:", () => {
            test("post.deletePost returns the deleted record", async () => {
                // Create a post in the database
                const post = await posts.createPost({
                    userId: user.id,
                    title: "test",
                    content: "test",
                    status: "PUBLISHED",
                    category: "GENERAL",
                    postTags: ["JS", "TS"],
                });
                expect(await posts.count()).toBe(1);

                // Delete the post
                expect(await posts.deletePost(post?.id as string)).toEqual(
                    post
                );
                expect(await posts.count()).toBe(0);
                expect(
                    await prisma.postTag.findMany({
                        where: {
                            postId: post?.id,
                        },
                    })
                ).toHaveLength(0);
            });

            // Non-existent post results in an exception so no need to test

            // test that it cascade deletes all comments and likes associated with the post once implemented
        });
    });
});

//
