import "./testSetup";
import axios from "axios";
import db from "../models/db";

describe("Integration tests for USER routes:", () => {
    // User update route handler
    // -------------------------------------------------------------------------
    describe("/api/user/update", () => {
        test("User is able to update their user data", async () => {
            // Create a user
            const initialUser = await axios.post("api/auth/register", {
                userName: "Achilles",
                email: "achilles@email.com",
                password: "Abc-1234",
            });
            expect(await db.user.count()).toBe(1);

            // Login the new user
            const response = await axios.post("/api/auth/login", {
                email: "achilles@email.com",
                password: "Abc-1234",
            });
            expect(response.status).toBe(200);
            expect(response.data.data.id).toBeDefined();

            // Get session cookie
            if (!response.headers["set-cookie"]) {
                throw new Error("No cookie returned");
            }
            const cookie: string = response.headers["set-cookie"][0];
            // Update our user
            const updatedUser = await axios.put(
                "/api/user/update",
                {
                    userName: "Homer",
                    email: "homer@gmail.com",
                    password: "Abc-1234",
                },
                { headers: { Cookie: cookie } }
            );
            expect(updatedUser.status).toBe(201);
            expect(initialUser.data.data.id).toBe(updatedUser.data.data.id);
            expect(updatedUser.data.data.userName).toBe("Homer");
        });

        test("User is unable to update using an already taken userName", async () => {
            // Create a user
            const initialUser1 = await axios.post("api/auth/register", {
                userName: "Penelope",
                email: "penelope@email.com",
                password: "Password1!",
            });
            expect(await db.user.count()).toBe(1);

            // Create a user
            const initialUser2 = await axios.post("api/auth/register", {
                userName: "Odysseus",
                email: "odysseus@email.com",
                password: "Password1!",
            });
            expect(await db.user.count()).toBe(2);
            expect(initialUser1.data.data.id).not.toBe(
                initialUser2.data.data.id
            );
            // Login the new user
            const response = await axios.post("/api/auth/login", {
                email: "odysseus@email.com",
                password: "Password1!",
            });
            expect(response.status).toBe(200);

            // Get session cookie
            if (!response.headers["set-cookie"]) {
                throw new Error("No cookie returned");
            }
            const cookie: string = response.headers["set-cookie"][0];

            // Update our user
            const updatedUser = await axios.put(
                "/api/user/update",
                {
                    userName: "Penelope",
                    email: "odysseus@gmail.com",
                    password: "Password1!",
                },
                { headers: { Cookie: cookie } }
            );
            expect(updatedUser.status).toBe(400);
        });

        test("User is unable to update using an already taken email", async () => {
            // Create a user
            const initialUser1 = await axios.post("api/auth/register", {
                userName: "Eurycleia",
                email: "eurycleia@email.com",
                password: "Password1!",
            });
            expect(await db.user.count()).toBe(1);

            // Create a user
            const initialUser2 = await axios.post("api/auth/register", {
                userName: "Hercules",
                email: "hercules@email.com",
                password: "Password1!",
            });
            expect(await db.user.count()).toBe(2);
            expect(initialUser1.data.data.id).not.toBe(
                initialUser2.data.data.id
            );
            // Login the new user
            const response = await axios.post("/api/auth/login", {
                email: "hercules@email.com",
                password: "Password1!",
            });

            expect(response.status).toBe(200);

            // Get session cookie
            if (!response.headers["set-cookie"]) {
                throw new Error("No cookie returned");
            }
            const cookie: string = response.headers["set-cookie"][0];

            // Update our user
            const updatedUser = await axios.put(
                "/api/user/update",
                {
                    userName: "Hercules",
                    email: "eurycleia@email.com",
                    password: "Password1!",
                },
                { headers: { Cookie: cookie } }
            );
            expect(updatedUser.status).toBe(400);
        });

        test("User is unable to be updated without a valid session", async () => {
            // Create a user
            await axios.post("api/auth/register", {
                userName: "Jupiter",
                email: "jupiter@email.com",
                password: "Password1!",
            });
            expect(await db.user.count()).toBe(1);

            // Lets not login and get a cookie for this one

            // Update our user
            const updatedUser = await axios.put("/api/user/update", {
                userName: "Jupiter",
                email: "jupiter@email.com",
                password: "MyPasswordIsNotGoingToChange!",
            });
            expect(updatedUser.status).toBe(401);
        });
    });

    // Validation Tests

    // Delete User route
    // ------------------------------------------------------------------------
    describe("deleteUser endpoint tests:", () => {
        test("User is able to delete own account", async () => {
            // Create a user
            const register = await axios.post("api/auth/register", {
                userName: "Jupiter",
                email: "jupiter@email.com",
                password: "Password1!",
            });
            expect(register.status).toBe(201);
            // Login the new user
            const response = await axios.post("/api/auth/login", {
                email: "jupiter@email.com",
                password: "Password1!",
            });

            expect(response.status).toBe(200);
            // Get session cookie
            if (!response.headers["set-cookie"]) {
                throw new Error("No cookie returned");
            }
            const cookie: string = response.headers["set-cookie"][0];
            // Delete the signed in user
            const deletionResponse = await axios.delete("/api/user/delete", {
                headers: { Cookie: cookie },
            });
            expect(deletionResponse.status).toBe(204);
        });
    });
});
