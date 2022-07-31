// Import controllers
import { register, login } from "../authController";
import { UserWithoutPassword } from "../../models/userModel";
import { getMockReq, getMockRes } from "@jest-mock/express";

beforeEach(() => {
    jest.resetAllMocks();
});

describe("Unit Tests for AUTH controllers", () => {
    describe("Register controller:", () => {
        let mockReturnUser: UserWithoutPassword;

        beforeAll(() => {
            // Mock return user
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
            const mockGetUserByEmail = jest.fn().mockResolvedValue(null);
            const mockGetUserByUserName = jest.fn().mockResolvedValue(null);
            const mockRegister = jest.fn().mockResolvedValue({});
            expect(
                typeof register(
                    mockGetUserByEmail,
                    mockGetUserByUserName,
                    mockRegister
                )
            ).toBe("function");
        });

        test("returns a 201 CREATED response with valid inputs", async () => {
            const mockGetUserByEmail = jest.fn().mockResolvedValue(null);
            const mockGetUserByUserName = jest.fn().mockResolvedValue(null);
            const mockRegister = jest.fn().mockResolvedValue(mockReturnUser);

            const req = getMockReq({
                body: {
                    userName: "bumblebee",
                    email: "johndoe@gmail.com",
                    password: "password",
                },
            });
            const { res, next } = getMockRes();

            const controller = register(
                mockGetUserByEmail,
                mockGetUserByUserName,
                mockRegister
            );
            await controller(req, res, next);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ status: "success", data: mockReturnUser });
        });

        test("returns 400 Bad Request if userName already exists in database", async () => {
            const mockGetUserByEmail = jest.fn().mockResolvedValue(null);
            const mockGetUserByUserName = jest
                .fn()
                .mockResolvedValue(mockReturnUser);
            const mockRegister = jest.fn();

            const req = getMockReq({
                body: {
                    userName: "vercel",
                    email: "vercel@gmail.com",
                    password: "password",
                },
            });

            const { res, next } = getMockRes();

            const controller = register(
                mockGetUserByEmail,
                mockGetUserByUserName,
                mockRegister
            );
            await controller(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockRegister).not.toHaveBeenCalled();
        });

        test("returns 400 Bad Request if email already exists in database", async () => {
            const mockGetUserByEmail = jest
                .fn()
                .mockResolvedValue(mockReturnUser);
            const mockGetUserByUserName = jest.fn().mockResolvedValue(null);
            const mockRegister = jest.fn();

            const req = getMockReq({
                body: {
                    userName: "helenOfTroy",
                    email: "helen@gmail.com",
                    password: "password",
                },
            });
            const { res, next } = getMockRes();

            const controller = register(
                mockGetUserByEmail,
                mockGetUserByUserName,
                mockRegister
            );
            await controller(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockRegister).not.toHaveBeenCalled();
        });

        test("Errors passed to next middleware to be caught in custom error handler", async () => {
            const mockGetUserByEmail = jest.fn().mockResolvedValue(null);
            const mockGetUserByUserName = jest.fn().mockResolvedValue(null);
            const mockRegister = jest.fn().mockImplementation(() => {
                throw new Error("Error");
            });
            const req = getMockReq({
                body: {
                    userName: "bumblebee",
                    email: "johndoe@gmail.com",
                    password: "password",
                },
            });
            const { res, next } = getMockRes();

            const controller = register(
                mockGetUserByEmail,
                mockGetUserByUserName,
                mockRegister
            );
            await controller(req, res, next);
            expect(next).toHaveBeenCalledWith(new Error("Error"));
        });

        test("User password hashed before being persisted to the database", async () => {
            const mockGetUserByEmail = jest.fn().mockResolvedValue(null);
            const mockGetUserByUserName = jest.fn().mockResolvedValue(null);
            const mockRegister = jest.fn().mockResolvedValue(mockReturnUser);
            const req = getMockReq({
                body: {
                    userName: "bumblebee",
                    email: "johndoe@gmail.com",
                    password: "password",
                },
            });
            const { res, next } = getMockRes();

            const controller = register(
                mockGetUserByEmail,
                mockGetUserByUserName,
                mockRegister
            );
            await controller(req, res, next);
            expect(mockRegister.mock.calls[0][0].password).toMatch(/\$2b\$/);
        });

        // prevent password from being returned with user object - integration test but need to change from USER type to UserSelect?
    });

    describe("Login controller:", () => {
        test("returns a function", () => {
            const mockGetCredentials = jest.fn()
            const mockGetUserByEmail = jest.fn()
            expect(typeof login(mockGetCredentials, mockGetUserByEmail)).toBe("function");
        });
    });

    // Add check for session cookie on successgul login
    // 400 Bad Request if user does not exist - perhaps a generic error message - bad credentials - outside can't tell if user exists or not
    // compare credentials with database
    // 401 Unauthorized if credentials do not match
    // 200 OK if credentials match - return user object
    // Check that errors passed to next() for handling
    // Check that req.session.user and re.session.loggedIn are set correctly
});
