import db from "../db";
import { prisma } from "../prisma";
import { faker } from "@faker-js/faker";
import { valueEquals } from "../../util/valueEquals";

// Import TypeScript types
import { UserWithoutPassword } from "../../models/userModel";
import { PostData, PostWithRelations } from "../postModel";
import { Status, Category } from ".prisma/client";

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
        describe("post.create:", () => {
            test("creates a new post in the database", async () => {
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
        });

        // Get post by id
        // -------------------------------------------------------------------------
        describe("post.getPostById:", () => {
            test("returns the correct post with associated tags, comments and likes", async () => {
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
        });

        // Update post
        // -------------------------------------------------------------------------
        describe("post.updatePost:", () => {
            test("updates the database and returns updated post with valid inputs", async () => {
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
                    result?.postTags.filter((t) => t.tag.name === "GraphQL")
                        .length
                ).toBe(1);
            });

            test("returns null when the post to update can't be found", async () => {
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
        });

        // Delete post
        // -------------------------------------------------------------------------
        describe("post.deletePost:", () => {
            test("returns the deleted record", async () => {
                // Create a post in the database
                const post = await posts.createPost(
                    fkPostData({
                        userId: user.id,
                    })
                );
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

            // Delete on a non-existent post results in an exception so no need to test it here

            // TODO: Delete Post
            // test that it cascade deletes all comments and likes associated with the post once implemented
        });

        // Search posts
        // -------------------------------------------------------------------------
        describe("post.searchPosts:", () => {
            let searchPosts: (PostWithRelations | null)[];

            beforeEach(async () => {
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
                        return posts.createPost(fkPostData(p));
                    })
                );
            });

            test("returns all published posts when no category or filters provided", async () => {
                const queryObject = {};
                const results = await posts.search(queryObject);

                // Filter and sort arrays for comparison
                results.sort((a, b) => (a.id < b.id ? -1 : 1));
                searchPosts = searchPosts.filter(
                    (p) => p?.status === "PUBLISHED"
                );
                searchPosts.sort((a, b) => {
                    if (a && b) return a.id < b.id ? -1 : 1;
                    return 0;
                });
                expect(valueEquals(results, searchPosts)).toBe(true);
            });

            test("returns all posts for the given category", async () => {
                const queryObject = {
                    category: "LEARN" as Category,
                };
                const results = await posts.search(queryObject);

                // No need to sort as number of results will suffice
                expect(results.length).toBe(3);
            });

            test("returns DRAFT || ALL posts when status flag given", async () => {
                // PUBLISHED status tested above so not tested here

                // DRAFT posts
                const queryObject = {
                    status: "DRAFT",
                };
                const results = await posts.search(queryObject);
                expect(results).toHaveLength(1);

                // ALL posts
                const queryObject2 = {
                    status: "ALL",
                };
                const results2 = await posts.search(queryObject2);
                expect(results2).toHaveLength(6);
            });

            test("returns all posts with a matching title", async () => {
                const queryObject = {
                    title: "JavaScript",
                };
                const results = await posts.search(queryObject);
                expect(results).toHaveLength(2);

                const queryObject2 = {
                    title: "Using JavaScript",
                };
                const results2 = await posts.search(queryObject2);
                expect(results2).toHaveLength(1);
            });

            test("returns all PUBLISHED posts with the given tags", async () => {
                // Query with no tags tested in a previous test

                // Test with one tag
                const queryObject = {
                    tags: ["React"],
                };
                const results = await posts.search(queryObject);
                expect(results).toHaveLength(1);

                // Test with multiple tags
                const queryObject2 = {
                    tags: ["React", "TS"],
                };
                const results2 = await posts.search(queryObject2);
                // Only returns 2 posts as one of the posts with the 'TS' tag is a draft
                expect(results2).toHaveLength(2);
            });

            test("sorts results by date DESC by default and by likes DESC with sortBy flag", async () => {
                // Create 5 users to generate likes for the posts
                const users = await Promise.all(
                    Array.from({ length: 5 }, () =>
                        db.user.register({
                            userName: faker.internet.userName(),
                            email: faker.internet.email(),
                            password: "Abc-123",
                        })
                    )
                );

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

                // Test default behaviour: Sort by date DESC
                const queryObject = {};
                const results = await posts.search(queryObject);
                expect(results).toHaveLength(5);

                // Filter and sort searchPosts by date DESC so we can compare to actual
                // results from the database
                searchPosts = searchPosts.filter(
                    (p) => p?.status === "PUBLISHED"
                );
                searchPosts.sort((a, b) => {
                    if (a && b) return a.createdDate > b.createdDate ? -1 : 1;
                    return 0;
                });

                results.forEach((p, i) => {
                    expect(p.id).toBe(searchPosts[i]?.id);
                });

                // Test with sortBy = "likes" flag
                const queryObject2 = {
                    sortBy: "likes",
                };
                const results2 = await posts.search(queryObject2);
                expect(results2).toHaveLength(5);

                results.forEach((p, i) => {
                    // Check that each post has more likes than the next post
                    // The conditional prevents checking the last post as it has nothing
                    // to compare to
                    if (results[i + 1]) {
                        expect(p.likes.length).toBeGreaterThan(
                            results[i + 1]?.likes.length
                        );
                    }
                });
            });

            test("returns an empty array if no results found", async () => {
                // Delete all posts from the database
                await posts.deleteMany({});

                // Search for all posts
                const queryObject = {};
                const results = await posts.search(queryObject);
                expect(results).toEqual([]);
            });

            // TODO: Search
            // returns null if no results found
        });
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
