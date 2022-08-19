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
        expect(users.getUserByUserName).toBeDefined();
        expect(users.update).toBeDefined();
    });

    describe("Custom Methods:", () => {
        // Register
        // -------------------------------------------------------------------------
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

        // Get user by email
        // -------------------------------------------------------------------------
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

        // Get user by userName
        // -------------------------------------------------------------------------
        test("user.getUserByUserName returns entire user object - without password", async () => {
            // First create a user in the database
            await users.register({
                userName: "get",
                email: "get@gmail.com",
                password: "getPassword",
            });
            expect(await users.count()).toBe(1);

            // Then get the user by userName
            const user = await users.getUserByUserName("get");
            expect(user?.userName).toBe("get");
            expect(user?.password).toBeUndefined();
        });

        // Get credentials
        // -------------------------------------------------------------------------
        test("user.getCredentials returns user email and password", async () => {
            // First create a user in the database
            await users.register({
                userName: "cred",
                email: "cred@gmail.com",
                password: "credPassword",
            });
            expect(await users.count()).toBe(1);

            // Then get user credentials
            const userCredentials = await users.getCredentials(
                "cred@gmail.com"
            );
            expect(userCredentials?.email).toBe("cred@gmail.com");
            expect(userCredentials?.password).toMatch("credPassword"); // Password not hashed as user was created directly
        });

        // Update user
        // -------------------------------------------------------------------------
        test("user.updateUser should update a user's account in the database", async () => {
            // First create a user in the database
            await users.register({
                userName: "jeff",
                email: "jeff@gmail.com",
                password: "jeffPassword",
            });
            expect(await users.count()).toBe(1);

            // Get the user so we can use their id to update with
            const user = await users.getUserByEmail("jeff@gmail.com");

            expect(user?.userName).toBe("jeff");
            // Now update "jeff"
            const updateData = {
                userName: "jeff",
                email: "jeff@gmail.com",
                password: "jeffPassword",
                firstName: "Jeff",
                lastName: "Bezos",
                jobTitle: "",
                city: "",
                imageUrl: "",
                linkedIn: "",
                github: "",
            };

            const userUpdated = await users.update({
                where: { id: user?.id },
                data: updateData,
            });
            expect(userUpdated?.firstName).toBe("Jeff");
            expect(userUpdated?.lastName).toBe("Bezos");
        });

        // Get user by ID
        // -------------------------------------------------------------------------
        test("user.getUserById with a valid id should return a user", async () => {
            // First create a user in the database
            const jeff = await users.register({
                userName: "jeff",
                email: "jeff@gmail.com",
                password: "jeffPassword",
            });
            expect(await users.count()).toBe(1);
            expect(jeff.id).toBeDefined();

            // Now test if we can get a user by their id
            const user = await users.getUserById(jeff.id);
            expect(user?.userName).toBe("jeff");
            expect(user?.id).toBe(jeff?.id);
        });

        test("Should be unable to getUserById on an id that doesn't exist", async () => {
            // It's important to check if the error this causes breaks our app or not
            const binChicken = await users.getUserById(
                "dj12j-21kd-21dk12d34-d21kd23"
            );

            expect(binChicken).toBe(null);
        });
    });
});
