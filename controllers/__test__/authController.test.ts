// Import controllers
import { register, login, logout } from "../authController";
import { getMockReq, getMockRes } from "@jest-mock/express";
import bcrypt from "bcrypt";

// Import TS types
import { UserWithoutPassword } from "../../models/userModel";

beforeEach(() => {
    jest.resetAllMocks();
});

describe("Unit Tests for AUTH controllers", () => {
    // Register Controller
    // -------------------------------------------------------------------------

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
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                data: mockReturnUser,
            });
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

        test("errors passed to next middleware to be caught in custom error handler", async () => {
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

        test("user password hashed before being persisted to the database", async () => {
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
    });

    // Login Controller
    // -------------------------------------------------------------------------

    describe("Login controller:", () => {
        test("returns a function", () => {
            const mockGetCredentials = jest.fn();
            const mockGetUserByEmail = jest.fn();
            expect(typeof login(mockGetCredentials, mockGetUserByEmail)).toBe(
                "function"
            );
        });

        const password = "password";
        let mockCredentials: { email: string; password: string };
        let mockUser: UserWithoutPassword;

        beforeEach(() => {
            // Create a mock user with hashed password
            const hashedPassword = bcrypt.hashSync("password", 6);

            mockCredentials = {
                email: "login@email.com",
                password: hashedPassword,
            };

            mockUser = {
                id: "4730c0b6-7a4a-4b6f-801b-f539303dbae0",
                firstName: null,
                lastName: null,
                userName: "loginuser",
                email: mockCredentials.email,
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

        test("returns 200 OK with valid inputs", async () => {
            const mockGetCredentials = jest
                .fn()
                .mockResolvedValue(mockCredentials);
            const mockGetUserByEmail = jest.fn().mockResolvedValue(mockUser);

            const req = getMockReq({
                body: {
                    email: mockCredentials.email,
                    password: password,
                },
                session: {},
            });
            const { res, next } = getMockRes();

            const controller = login(mockGetCredentials, mockGetUserByEmail);
            await controller(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(req.session.user).toMatchObject(mockUser);
            expect(req.session.loggedIn).toBe(true);
        });

        test("returns 400 Bad Request if user does not exist", async () => {
            const mockGetCredentials = jest.fn().mockResolvedValue(null);
            const mockGetUserByEmail = jest.fn().mockResolvedValue(null);

            const req = getMockReq({
                body: {
                    email: mockCredentials.email,
                    password: password,
                },
                session: {},
            });
            const { res, next } = getMockRes();

            const controller = login(mockGetCredentials, mockGetUserByEmail);
            await controller(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockGetCredentials).toHaveBeenCalledWith(
                mockCredentials.email
            );
            expect(mockGetUserByEmail).not.toHaveBeenCalled();
            expect(req.session.user).toBe(undefined);
            expect(req.session.loggedIn).toBe(undefined);
        });

        test("returns 400 Bad Request if user password doesn't match", async () => {
            const mockGetCredentials = jest
                .fn()
                .mockResolvedValue(mockCredentials);
            const mockGetUserByEmail = jest.fn().mockResolvedValue(mockUser);

            const req = getMockReq({
                body: {
                    email: mockCredentials.email,
                    password: "wrongpassword",
                },
                session: {},
            });
            const { res, next } = getMockRes();

            const controller = login(mockGetCredentials, mockGetUserByEmail);
            await controller(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockGetCredentials).toHaveBeenCalledWith(
                mockCredentials.email
            );
            expect(mockGetUserByEmail).not.toHaveBeenCalled();
            expect(req.session.user).toBe(undefined);
            expect(req.session.loggedIn).toBe(undefined);
        });

        test("getCredentials errors passed through to next()", async () => {
            const mockGetCredentials = jest.fn().mockImplementation(() => {
                throw new Error("Error");
            });
            const mockGetUserByEmail = jest.fn().mockResolvedValue("a user");
            const req = getMockReq({
                body: {
                    email: mockCredentials.email,
                    password: password,
                },
                session: {},
            });
            const { res, next } = getMockRes();

            const controller = login(mockGetCredentials, mockGetUserByEmail);
            await controller(req, res, next);
            expect(next).toHaveBeenCalledWith(new Error("Error"));
            expect(mockGetUserByEmail).not.toHaveBeenCalled();
            expect(req.session.user).toBe(undefined);
            expect(req.session.loggedIn).toBe(undefined);
        });

        test("getUserByEmail errors passed through to next()", async () => {
            const mockGetCredentials = jest
                .fn()
                .mockResolvedValue(mockCredentials);
            const mockGetUserByEmail = jest.fn().mockImplementation(() => {
                throw new Error("Error");
            });
            const req = getMockReq({
                body: {
                    email: mockCredentials.email,
                    password: password,
                },
                session: {},
            });
            const { res, next } = getMockRes();

            const controller = login(mockGetCredentials, mockGetUserByEmail);
            await controller(req, res, next);
            expect(next).toHaveBeenCalledWith(new Error("Error"));
            expect(req.session.user).toBe(undefined);
            expect(req.session.loggedIn).toBe(undefined);
        });
    });

    // Logout controller
    // -------------------------------------------------------------------------

    describe("Logout controller:", () => {
        test("controller returns a function", () => {
            expect(typeof logout()).toBe("function");
        });

        let mockUser: UserWithoutPassword;
        beforeEach(() => {
            mockUser = {
                id: "4730c0b6-7a4a-4b6f-801b-f539303dbae0",
                firstName: null,
                lastName: null,
                userName: "loggedinuser",
                email: "loggedin@gmail.com",
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

        test("returns 200 OK and destroys session object", async () => {
            const req = getMockReq({
                session: {
                    user: mockUser,
                    loggedIn: true,
                    save: jest.fn(),
                    destroy: jest.fn(),
                },
            });
            const { res, next } = getMockRes();

            const controller = logout();
            controller(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(req.session.user).toBe(undefined);
            expect(req.session.loggedIn).toBe(undefined);
            expect(req.session.save).toHaveBeenCalled();
            expect(req.session.destroy).toHaveBeenCalled();
        });

        test("session.save() errors passed through to next()", async () => {
            const req = getMockReq({
                session: {
                    user: mockUser,
                    loggedIn: true,
                    save: jest.fn().mockImplementation(() => {
                        throw new Error("Error");
                    }),
                    destroy: jest.fn(),
                },
            });
            const { res, next } = getMockRes();

            const controller = logout();
            controller(req, res, next);

            expect(req.session.save).toHaveBeenCalled();
            expect(req.session.destroy).not.toHaveBeenCalled();
            const saveFunc = jest.mocked(req.session).save.mock.calls[0][0];
            if (saveFunc) saveFunc(new Error("Error"));
            expect(next).toHaveBeenCalledWith(new Error("Error"));
        });

        test("session.save() errors passed through to next()", async () => {
            const req = getMockReq({
                session: {
                    user: mockUser,
                    loggedIn: true,
                    save: jest.fn(),
                    destroy: jest.fn().mockImplementation(() => {
                        throw new Error("Error");
                    }),
                },
            });
            const { res, next } = getMockRes();

            const controller = logout();
            controller(req, res, next);

            expect(req.session.save).toHaveBeenCalled();
            expect(req.session.destroy).toHaveBeenCalled();
            const destroyFunc = jest.mocked(req.session).destroy.mock
                .calls[0][0];
            if (destroyFunc) destroyFunc(new Error("Error"));
            expect(next).toHaveBeenCalledWith(new Error("Error"));
        });
    });
});
