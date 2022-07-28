// Import controllers
import { register, login } from "../authController";
import { Register } from "../../models/userModel";
import { User } from "@prisma/client";
import { getMockReq, getMockRes } from "@jest-mock/express";


beforeEach(() => {
    jest.resetAllMocks();
});

describe("Unit Tests for AUTH controllers", () => {
    describe("Register controller:", () => {

        let mockReturnUser: User

        beforeAll(() => {
            // Mock return user
            mockReturnUser = {
                id: "4730c0b6-7a4a-4b6f-801b-f539303dbae0",
                firstName: null,
                lastName: null,
                userName: "bumblebee",
                email: "johndoe@gmail.com",
                password: "password",
                role: "USER",
                isActive: null,
                jobTitle: null,
                positionId: null,
                city: null,
                imageUrl: null,
                linkedIn: null,
                github: null,
            };
        })

        test("returns a function", async () => {
            expect(typeof register(jest.fn().mockResolvedValue({}))).toBe(
                "function"
            );
        });

        test("returns a 201 CREATED response with valid inputs", async () => {
            
            // Provide a mock db method to register()
            const mockRegister = jest
                .fn()
                .mockResolvedValue(mockReturnUser) as Register;

            const req = getMockReq({
                body: {
                    userName: "bumblebee",
                    email: "johndoe@gmail.com",
                    password: "password",
                },
            });
            const { res, next } = getMockRes();

            const controller = register(mockRegister);
            await controller(req, res, next);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockReturnUser);
        });
        
        test("Errors passed to next middleware to be caught in custom error handler", async () => {
            const mockRegister = jest.fn().mockImplementation(() => { throw new Error("Error"); });
            const req = getMockReq({
                body: {
                    userName: "bumblebee",
                    email: "johndoe@gmail.com",
                    password: "password",
                },
            });
            const { res, next } = getMockRes();

            const controller = register(mockRegister);
            await controller(req, res, next);
            expect(next).toHaveBeenCalledWith(new Error("Error"));
        })
        
        test("User password hashed before being persisted to the database", async () => {
            const mockRegister = jest.fn().mockResolvedValue(mockReturnUser);
            const req = getMockReq({
                body: {
                    userName: "bumblebee",
                    email: "johndoe@gmail.com",
                    password: "password",
                },
            });
            const { res, next } = getMockRes();

            const controller = register(mockRegister);
            await controller(req, res, next);
            expect(mockRegister.mock.calls[0][0].password).toMatch(/\$2b\$/);
        })
        
        test("")
        
        // prevent password from being returned with user object - integration test but need to change from USER type to UserSelect?

        // INTEGRATION
        // Prevent registration if username or email already exists in DB
        // Check that password hashed
        // VALIDATION TESTS [400]:
        // Prevent registration if fields missing
        // Reject invalid inputs
        // Reject unexpected attributes
        // Others
    });

    describe("Login controller:", () => {
        test("returns a function", () => {
            expect(typeof login()).toBe("function");
        });
    });
});

