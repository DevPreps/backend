// Import controllers
import { update } from "../userController";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { UserWithoutPassword } from "../../models/userModel";

// Import TS types

beforeEach(() => {
    jest.resetAllMocks();
});

describe("Unit Tests for User controllers", () => {
    // Update Controller
    describe("Update controller:", () => {
        let mockReturnUser: UserWithoutPassword;

        beforeAll(() => {
            // Mock return User
            mockReturnUser = {
                id: "4730c0b6-7a4a-4b6f-801b-f539303dbae0",
                firstName: null,
                lastName: null,
                userName: "bumblebee",
                email: "johndoe@gmail.com",
                role: "USER",
                isActive: null,
                jobTitle: null,
                positionId: null,
                city: null,
                imageUrl: null,
                linkedIn: null,
                github: null,
            };
        });

        test("returns a function", async () => {

        })
    })
})
