import db from "../db";
import { prisma } from "../prisma";

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
        expect(await prisma.user.count()).toBe(1);
    });

    test("removes password from the returned user object", async () => {
        const user = await db.user.findUnique({
            where: { email: "test@email.com" },
        });
        expect(user?.password).toBeUndefined();
        const user2 = await db.user.findMany({
            where: { email: "test@email.com" },
        });
        expect(user2[0]?.password).toBeUndefined();
    });

    test("includes password if added to select in prisma query", async () => {
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
