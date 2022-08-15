import db from "../db";

jest.mock("../prisma");

const posts = db.post;

describe("Unit Tests for Post Model:", () => {
    test("returns an object which contains prisma post functions", () => {
        expect(posts.count).toBeDefined();
        expect(posts.findMany).toBeDefined();
    });

    test("returns an object with custom methods", () => {
        expect(posts.create).toBeDefined();
    });

    describe("Custom Methods:", () => {
        // Create post
        // -------------------------------------------------------------------------
        test("post.create creates a new post in the database", async () => {
            expect(await posts.count()).toBe(0);

            // Create a user in the database
            const user = await db.user.register({
                userName: "test",
                email: "test@email.com",
                password: "testPassword",
            });
            expect(await db.user.count()).toBe(1);

            await posts.createPost({
                userId: user.id,
                title: "test",
                content: "test",
                status: "DRAFT",
                category: "GENERAL",
                // postTags: ["JS, TS"]
            });
            expect(await posts.count()).toBe(1);
        });
    });
});
