// Import controllers
import { update } from "../userController";
import { getMockReq, getMockRes } from "@jest-mock/express";

// Import TS types
import { UserWithoutPassword } from "../../models/userModel";

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
                id: "2851c0b6-9b2f-2h0u-219x-h421084ghel1",
                firstName: null,
                lastName: null,
                userName: "Alcinous",
                email: "alcinous@gmail.com",
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
            const mockUpdate = jest.fn().mockResolvedValue({});
            expect(
                typeof update(
                    mockGetUserByEmail,
                    mockGetUserByUserName,
                    mockUpdate
                )
            ).toBe("function");
        });

        test("return 201 if user update succeeds ", async () => {
            const mockGetUserByEmail = jest.fn().mockResolvedValue(null);
            const mockGetUserByUserName = jest.fn().mockResolvedValue(null);
            const mockUpdate = jest.fn().mockResolvedValue(mockReturnUser);

            const req = getMockReq({
                body: {
                    userName: "Poseidon",
                    email: "poseidon@gmail.com",
                    password: "Password1",
                },
                session: {user: {id: "2851c0b6-9b2f-2h0u-219x-h421084ghel",}},
            });
            const { res, next } = getMockRes();

            const controller = update(
                mockGetUserByEmail,
                mockGetUserByUserName,
                mockUpdate
            );
            await controller(req, res, next);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                data: mockReturnUser,
            });
        });

        test("return 400 if userName is taken by a different id when updating", async () => {
            const mockGetUserByEmail = jest.fn().mockResolvedValue(null);
            const mockGetUserByUserName = jest
                .fn()
                .mockResolvedValue(mockReturnUser);
            const mockUpdate = jest.fn();

            const req = getMockReq({
                body: {
                    userName: "Athena",
                    email: "athena@gmail.com",
                    password: "Password1",
                },
                session: {user: {id: "2851c0b6-9b2f-2h0u-219x-h421084ghel",}},
            });
            const { res, next } = getMockRes();

            const controller = update(
                mockGetUserByEmail,
                mockGetUserByUserName,
                mockUpdate
            );
            await controller(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockUpdate).not.toHaveBeenCalled();
        });

        test("return 400 if email is taken by a different id when updating", async () => {
            const mockGetUserByEmail = jest
                .fn()
                .mockResolvedValue(mockReturnUser);
            const mockGetUserByUserName = jest.fn().mockResolvedValue(null);
            const mockUpdate = jest.fn();

            const req = getMockReq({
                body: {
                    userName: "Calypso",
                    email: "calypso@gmail.com",
                    password: "Password1",
                },
                session: {user: {id: "2851c0b6-9b2f-2h0u-219x-h421084ghel",}},
            });
            const { res, next } = getMockRes();

            const controller = update(
                mockGetUserByEmail,
                mockGetUserByUserName,
                mockUpdate
            );
            await controller(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockUpdate).not.toHaveBeenCalled();
        });

        test("errors passed to next middleware to be caught in custom error handler", async () => {
            const mockGetUserByEmail = jest.fn().mockResolvedValue(null);
            const mockGetUserByUserName = jest.fn().mockResolvedValue(null);
            const mockUpdate = jest.fn().mockImplementation(() => {
                throw new Error("Error");
            });
            const req = getMockReq({
                body: {
                    userName: "Telemachus",
                    email: "telemachus@gmail.com",
                    password: "Password1",
                },
                session: {user: {id: "2851c0b6-9b2f-2h0u-219x-h421084ghel",}},
            });
            const { res, next } = getMockRes();

            const controller = update(
                mockGetUserByEmail,
                mockGetUserByUserName,
                mockUpdate
            );
            await controller(req, res, next);
            expect(next).toHaveBeenCalledWith(new Error("Error"));
        });
    });
});
