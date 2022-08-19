import db from "../db";

jest.mock("../prisma");

describe("Unit Tests for Database Object:", () => {
    test("db object exitsts", () => {
        expect(db).toBeDefined();
    });

    test("contains user object with default and custom methods", () => {
        expect(db.user).toBeDefined();
        expect(typeof db.user).toBe("object");
        expect(db.user.count).toBeDefined();
        expect(db.user.register).toBeDefined();
        expect(db.user.getUserByEmail).toBeDefined();
        expect(db.user.getUserByUserName).toBeDefined();
        expect(db.user.getCredentials).toBeDefined();
    });

    test("contains post object with default and custom methods", () => {
        expect(db.post).toBeDefined();
        expect(typeof db.post).toBe("object");
        expect(db.post.count).toBeDefined();
        expect(db.post.createPost).toBeDefined();
        expect(db.post.getPostById).toBeDefined();
    });

    test("contains tag object with default methods", () => {
        expect(db.tag).toBeDefined();
        expect(typeof db.tag).toBe("object");
        expect(db.tag.count).toBeDefined();
    });
});

describe("Unit Tests for Prisma Middleware", () => {
    beforeEach(async () => {
        // Add a user to the database
        await db.user.register({
            userName: "username",
            email: "test@email.com",
            password: "testPassword",
        });
        expect(await db.user.count()).toBe(1);
    });

    test("middleware removes password from the returned user object", async () => {
        const user = await db.user.getUserByEmail("test@email.com");
        expect(user?.password).toBeUndefined();
        const user2 = await db.user.findMany({
            where: { email: "test@email.com" },
        });
        expect(user2[0]?.password).toBeUndefined();
    });

    test("middleware allows password to be retuned if included in Prisma select query", async () => {
        const user = await db.user.findUnique({
            where: { email: "test@email.com" },
            select: { password: true },
        });
        expect(user?.password).toBe("testPassword");
        const user2 = await db.user.findMany({
            where: { email: "test@email.com" },
            select: { password: true },
        });
        expect(user2[0]?.password).toBe("testPassword");
    });
});
