import db from "../db";
import { prisma } from "../prisma";
import { faker } from "@faker-js/faker";

// Import TypeScript types
import { UserWithoutPassword } from "../../models/userModel";
import { PostData } from "../postModel";

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
                data: [...possibleTags.map((t) => ({ name: t }))],
            });
            expect(await db.tag.count()).toBe(6);
        });

        // Create post
        // -------------------------------------------------------------------------
        test("post.create creates a new post in the database", async () => {
            expect(await posts.count()).toBe(0);

            await posts.createPost(
                fkPostData({
                    userId: user.id,
                })
            );
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
            expect(result?.postTags.length).toBeGreaterThan(0);
        });

        // Get post by id
        // -------------------------------------------------------------------------
        test("post.getPostById returns the correct post with associated tags, comments and likes", async () => {
            expect(await posts.count()).toBe(0);

            // Create some posts in the database
            const post1 = await posts.createPost(
                fkPostData({
                    userId: user.id,
                })
            );

            const post2 = await posts.createPost(
                fkPostData({
                    userId: user.id,
                })
            );
            expect(await posts.count()).toBe(2);
            expect(post1?.id).not.toEqual(post2?.id);

            // Get post1 by id
            const result = await posts.getPostById(post1?.id as string);
            expect(result?.id).toBe(post1?.id);

            // Check that tags are included
            expect(result?.postTags.length).toBeGreaterThan(0);
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

        // TODO: get post by id
        // Should return all related comments
        // Should return all related likes

        // Update post
        // -------------------------------------------------------------------------
        test("post.updatePost updates the database and returns updated post with valid inputs", async () => {
            // Create a post in the database
            const postData: PostData = fkPostData({
                userId: user.id,
                title: "test",
                postTags: ["JS", "TS"],
            });
            const post = await posts.createPost(postData);
            expect(await posts.count()).toBe(1);

            const modifiedPost = {
                ...postData,
                title: "updated",
                postTags: ["JS", "TS", "GraphQL"],
            };

            // Update the post
            const result = await posts.updatePost(
                post?.id as string,
                modifiedPost
            );
            expect(result?.title).toBe("updated");
            expect(result?.postTags.length).toBe(3);
            expect(
                result?.postTags.filter((t) => t.tag.name === "GraphQL").length
            ).toBe(1);
        });

        test("post.updatePost returns null when the post to update can't be found", async () => {
            const postId = "not-a-valid-id";
            // Create a post in the database
            const postData: PostData = fkPostData({
                userId: user.id,
            });

            const result = await posts.updatePost(postId, postData);
            expect(result).toBeNull();
        });

        // TODO: Update Post
        // Should return all related comments
        // Should return all related likes

        // Delete post
        // -------------------------------------------------------------------------
        test("post.deletePost returns the deleted record", async () => {
            // Create a post in the database
            const post = await posts.createPost(
                fkPostData({
                    userId: user.id,
                })
            );
            expect(await posts.count()).toBe(1);

            // Delete the post
            expect(await posts.deletePost(post?.id as string)).toEqual(post);
            expect(await posts.count()).toBe(0);
            expect(
                await prisma.postTag.findMany({
                    where: {
                        postId: post?.id,
                    },
                })
            ).toHaveLength(0);
        });

        // Delete on a non-existent post results in an exception so no need to test it here

        // TODO: Delete Post
        // test that it cascade deletes all comments and likes associated with the post once implemented

        test("post.search returns all published posts when no category provided", () => {
            expect(posts.search()).toBe("results"); //posts.findMany({ where: { status: "PUBLISHED" } }));
        });

        // TODO: Search
        // returns all posts for the given category || all posts
        // only returns posts with status of PUBLISHED
        // correctly filters posts by tag
        // correctly filters posts by title search query
        // correctly sorts posts by date (default) or number of likes (if sortBy is "likes")
    });
});

// Faker
// -------------------------------------------------------------------------

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
