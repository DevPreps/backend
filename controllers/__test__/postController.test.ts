import { getMockReq, getMockRes } from "@jest-mock/express";
import { v4 } from "uuid";
import { createPost } from "../postController";
import { TagMethods } from "../../models/tagModel";

describe("Unit Tests for Post Controllers", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("CreatePost Controller:", () => {
        let mockGetAllTags: TagMethods.GetAllTags;

        beforeEach(() => {
            mockGetAllTags = jest
                .fn()
                .mockResolvedValue([
                    { name: "JS" },
                    { name: "TS" },
                    { name: "GraphQL" },
                ]);
        });

        test("returns a function", () => {
            const mockDBCreatePost = jest.fn().mockResolvedValue({});
            expect(typeof createPost(mockGetAllTags, mockDBCreatePost)).toBe(
                "function"
            );
        });

        test("inputs passed correctly to create post method", async () => {
            const mockDBCreatePost = jest.fn();
            const req = getMockReq({
                session: {
                    user: {
                        id: v4(),
                    },
                },
                body: {
                    title: "test",
                    content: "test",
                    status: "DRAFT",
                    category: "GENERAL",
                    postTags: ["JS", "TS"],
                },
            });
            const { res, next } = getMockRes();
            await createPost(mockGetAllTags, mockDBCreatePost)(req, res, next);
            expect(jest.mocked(mockDBCreatePost).mock.calls[0][0].title).toBe(
                "test"
            );
        });

        test("returns 201 Created and the created post", async () => {
            const mockDBCreatePost = jest.fn().mockResolvedValue({});
            const req = getMockReq({
                session: {
                    user: {
                        id: v4(),
                    },
                },
                body: {
                    title: "test",
                    content: "test",
                    status: "DRAFT",
                    category: "GENERAL",
                    postTags: ["JS", "TS"],
                },
            });
            const { res, next } = getMockRes();
            await createPost(mockGetAllTags, mockDBCreatePost)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                data: {},
            });
        });

        test("returns 400 Bad Request when tags not in the database", async () => {
            const mockDBCreatePost = jest.fn();
            const req = getMockReq({
                session: {
                    user: {
                        id: v4(),
                    },
                },
                body: {
                    title: "test",
                    content: "test",
                    status: "DRAFT",
                    category: "GENERAL",
                    postTags: ["Cobalt"],
                },
            });
            const { res, next } = getMockRes();
            await createPost(mockGetAllTags, mockDBCreatePost)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test("calls next() if an error occurs", async () => {
            const mockDBCreatePost = jest.fn().mockImplementation(() => {
                throw new Error("error");
            });
            const req = getMockReq({
                session: {
                    user: {
                        id: v4(),
                    },
                },
                body: {
                    title: "test",
                    content: "test",
                    status: "DRAFT",
                    category: "GENERAL",
                    postTags: ["JS", "TS"],
                },
            });
            const { res, next } = getMockRes();
            await createPost(mockGetAllTags, mockDBCreatePost)(req, res, next);
            expect(next).toHaveBeenCalledWith(new Error("error"));
        });
    });
});
