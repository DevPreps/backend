import { getMockReq, getMockRes } from "@jest-mock/express";
import { v4 } from "uuid";
import { createPost, getPostById, updatePost } from "../postController";
import { TagMethods } from "../../models/tagModel";

describe("Unit Tests for Post Controllers", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    // Create post
    // -------------------------------------------------------------------------
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

    // Get post by id
    // -------------------------------------------------------------------------
    describe("GetPostById Controller:", () => {
        test("returns a function", () => {
            const mockDBGetPostById = jest.fn();
            expect(typeof getPostById(mockDBGetPostById)).toBe("function");
        });

        test("responds with 200 ok and the requested post with valid inputs", async () => {
            const mockPost = { id: v4(), title: "test", content: "test" };
            const mockDBGetPostById = jest.fn().mockResolvedValue(mockPost);
            const req = getMockReq({
                postId: "5e9f8f8f-f8f8-f8f8-f8f8-f8f8f8f8f8f8",
            });
            const { res, next } = getMockRes();
            await getPostById(mockDBGetPostById)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                data: mockPost,
            });
        });

        test("passes correct data to db.post.getPostById", async () => {
            const mockDBGetPostById = jest.fn();
            const req = getMockReq({
                postId: "test",
            });
            const { res, next } = getMockRes();
            await getPostById(mockDBGetPostById)(req, res, next);
            expect(jest.mocked(mockDBGetPostById).mock.calls[0][0]).toBe(
                req.body.postId
            );
        });

        test("returns 400 Bad Request if post doesn't exist", async () => {
            const mockDBGetPostById = jest.fn().mockResolvedValue(null);
            const req = getMockReq({
                postId: "test",
            });
            const { res, next } = getMockRes();
            await getPostById(mockDBGetPostById)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test("calls next() if an error occurs", async () => {
            const mockDBGetPostById = jest.fn().mockImplementation(() => {
                throw new Error("error");
            });
            const req = getMockReq({
                postId: "test",
            });
            const { res, next } = getMockRes();
            await getPostById(mockDBGetPostById)(req, res, next);
            expect(next).toHaveBeenCalledWith(new Error("error"));
        });
    });

    // Update post
    // -------------------------------------------------------------------------
    describe("Update post:", () => {
        test("returns a function", () => {
            const mockDBUpdatePost = jest.fn().mockResolvedValue({});
            expect(typeof updatePost(mockDBUpdatePost)).toBe("function");
        });

        test("returns 200 OK with updated post, tags, likes and comments with valid inputs", async () => {
            const mockDBUpdatePost = jest.fn().mockResolvedValue("test post");
            const req = getMockReq();
            const { res, next } = getMockRes();
            await updatePost(mockDBUpdatePost)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                data: "test post",
            });
        });

        test("correct data is passed to db.post.updatePost", async () => {
            const mockDBUpdateData = jest.fn();
            const req = getMockReq({
                body: {
                    postId: "test id",
                    updatedData: "test data",
                },
            });
            const { res, next } = getMockRes();
            await updatePost(mockDBUpdateData)(req, res, next);
            expect(mockDBUpdateData).toHaveBeenCalledWith(
                req.body.postId,
                req.body.updatedData
            );
        });

        test("returns 400 Bad Request when post doesn't exist in the database", async () => {
            const mockDBUpdatePost = jest.fn().mockResolvedValue(null);
            const req = getMockReq();
            const { res, next } = getMockRes();
            await updatePost(mockDBUpdatePost)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test("calls next() when an error occurs", async () => {
            const mockDBUpdatePost = jest.fn().mockImplementation(() => {
                throw new Error("error");
            });
            const req = getMockReq();
            const { res, next } = getMockRes();
            await updatePost(mockDBUpdatePost)(req, res, next);
            expect(next).toHaveBeenCalledWith(new Error("error"));
        });
    });
});
