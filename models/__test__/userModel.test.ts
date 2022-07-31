import db from "../db";

jest.mock("../prisma");

const users = db.user;

describe("Unit Tests for User Model:", () => {
    test("returns an object which contains prisma user functions", () => {
        expect(users.count).toBeDefined();
        expect(users.findMany).toBeDefined();
    });

    test("returns an object with custom methods", () => {
        expect(users.register).toBeDefined();
        expect(users.getUserByEmail).toBeDefined();
    });

    // Register method
    describe("Custom Methods:", () => {
        test("users.register registers a user in the database", async () => {
            expect(await users.count()).toBe(0);

            // An empty registration object works here as data doesn't pass through
            // route validation
            await users.register({
                userName: "",
                email: "",
                password: "",
            });

            expect(await users.count()).toBe(1);
        });

        test("user.getUserByEmail returns entire user object - without password", async () => {
            // First create a user in the database
            await users.register({
                userName: "reg",
                email: "reg@gmail.com",
                password: "regPassword",
            });
            expect(await users.count()).toBe(1);

            // Then get the user by email
            const user = await users.getUserByEmail("reg@gmail.com");
            expect(user?.userName).toBe("reg");
            expect(user?.password).toBeUndefined();
        });
    });
});
