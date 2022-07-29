import userModel from "../userModel";
import { prisma } from "../prisma";

jest.mock("../prisma");

const users = userModel;

describe("Unit Tests for User Model:", () => {
    test("returns an object which contains prisma user functions", () => {
        expect(users.count).toBeDefined();
        expect(users.findMany).toBeDefined();
    });

    test("returns an object with custom attributes", () => {
        expect(users.register).toBeDefined();
    });

    // Register method
    describe("Register Method:", () => {
        test("registers a user in the database", async () => {
            expect(await prisma.user.count()).toBe(0);

            // An empty registration object works here as data doesn't pass through
            // route validation
            await users.register({
                userName: "",
                email: "",
                password: "",
            });

            expect(await prisma.user.count()).toBe(1);
        });
    });
});
