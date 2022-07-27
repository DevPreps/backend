// Returned user is of newly extended type
// register creates a new user in the database

import userModel from "../userModel";
import { prisma } from "../prisma";

jest.mock("../prisma");

describe("Unit Tests for User Model:", () => {
    test("model should exist", () => {
        expect(userModel).toBeDefined();
    });

    test("returns an object which contains prisma user functions", () => {
        expect(userModel(prisma.user).count).toBeDefined();
        expect(userModel(prisma.user).findMany).toBeDefined();
    });

    test("returns an object with custom attributes", () => {
        expect(userModel(prisma.user).register).toBeDefined();
    });

    // Register method
    describe("Register Method:", () => {

        test("registers a user in the database", async () => {
            expect(await prisma.user.count()).toBe(0);

            // An empty registration object works here as data doesn't pass through
            // route validation
            await userModel(prisma.user).register({
                userName: "",
                email: "",
                password: ""
            });
            
            expect(await prisma.user.count()).toBe(1);
        });



    });
});
