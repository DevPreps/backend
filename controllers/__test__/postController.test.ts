import { getMockReq, getMockRes } from "@jest-mock/express";
import { v4 } from "uuid";
import {
    createPost,
    getPostById,
    updatePost,
    deletePost,
    searchPublishedPosts,
} from "../postController";

describe("Unit Tests for Post Controllers", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    // Create post
    // -------------------------------------------------------------------------
    describe("CreatePost Controller:", () => {
        test("returns a function", () => {
            const mockDBCreatePost = jest.fn().mockResolvedValue({});
            expect(typeof createPost(mockDBCreatePost)).toBe("function");
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
            await createPost(mockDBCreatePost)(req, res, next);
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
            await createPost(mockDBCreatePost)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                data: {},
            });
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
            await createPost(mockDBCreatePost)(req, res, next);
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
            const mockDBGetPostById = jest.fn();
            const mockDBUpdatePost = jest.fn();
            expect(typeof updatePost(mockDBGetPostById, mockDBUpdatePost)).toBe(
                "function"
            );
        });

        test("returns 200 OK with updated post, tags, likes and comments with valid inputs", async () => {
            const mockDBGetPostById = jest.fn().mockResolvedValue({
                userId: "test id",
                id: "test id",
            });
            const mockDBUpdatePost = jest.fn().mockResolvedValue("test post");
            const req = getMockReq({
                body: {
                    postId: "test id",
                    updatedData: {},
                },
                session: {
                    user: {
                        id: "test id",
                    },
                },
            });
            const { res, next } = getMockRes();
            await updatePost(mockDBGetPostById, mockDBUpdatePost)(
                req,
                res,
                next
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                data: "test post",
            });
        });

        test("correct data is passed to db methods", async () => {
            const mockDBGetPostById = jest.fn().mockResolvedValue({
                userId: "test id",
                id: "test id",
            });
            const mockDBUpdateData = jest.fn();
            const req = getMockReq({
                body: {
                    postId: "test id",
                    updatedData: {},
                },
                session: {
                    user: {
                        id: "test id",
                    },
                },
            });
            const { res, next } = getMockRes();
            await updatePost(mockDBGetPostById, mockDBUpdateData)(
                req,
                res,
                next
            );
            expect(mockDBGetPostById).toBeCalledWith(req.body.postId);
            expect(mockDBUpdateData).toHaveBeenCalledWith(req.body.postId, {
                ...req.body.updatedData,
                userId: req?.session?.user?.id,
            });
        });

        test("returns 400 Bad Request when post doesn't exist in the database", async () => {
            const mockDBGetPostById = jest.fn().mockResolvedValue(null);
            const mockDBUpdatePost = jest.fn();
            const req = getMockReq({
                body: {
                    postId: "test id",
                    updatedData: "test data",
                },
                session: {
                    user: {
                        id: "test id",
                    },
                },
            });
            const { res, next } = getMockRes();
            await updatePost(mockDBGetPostById, mockDBUpdatePost)(
                req,
                res,
                next
            );
            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockDBUpdatePost).not.toHaveBeenCalled();
        });

        test("calls next() when an error occurs", async () => {
            const mockDBGetPostById = jest.fn().mockImplementation(() => {
                throw new Error("error");
            });
            const mockDBUpdatePost = jest.fn();
            const req = getMockReq({
                body: {
                    postId: "test id",
                    updatedData: "test data",
                },
            });
            const { res, next } = getMockRes();
            await updatePost(mockDBGetPostById, mockDBUpdatePost)(
                req,
                res,
                next
            );
            expect(next).toHaveBeenCalledWith(new Error("error"));
            expect(mockDBUpdatePost).not.toHaveBeenCalled();
        });

        test("returns 403 Forbidden if the post is not owned by the user", async () => {
            const mockDBGetPostById = jest.fn().mockResolvedValue({
                userId: "not the same id",
            });
            const mockDBUpdatePost = jest.fn();
            const req = getMockReq({
                body: {
                    postId: "test id",
                    updatedData: "test data",
                },
                session: {
                    user: {
                        id: "test id",
                    },
                },
            });
            const { res, next } = getMockRes();
            await updatePost(mockDBGetPostById, mockDBUpdatePost)(
                req,
                res,
                next
            );
            expect(res.status).toHaveBeenCalledWith(403);
            expect(mockDBUpdatePost).not.toHaveBeenCalled();
        });
    });

    // Delete post
    // -------------------------------------------------------------------------
    describe("DeletePost controller:", () => {
        test("returns a function", () => {
            const mockDBGetPostById = jest.fn();
            const mockDBDeletePost = jest.fn();
            expect(typeof deletePost(mockDBGetPostById, mockDBDeletePost)).toBe(
                "function"
            );
        });

        test("returns 200 OK and the deleted post", async () => {
            const mockDBGetPostById = jest.fn().mockResolvedValue({});
            const mockDBDeletePost = jest
                .fn()
                .mockResolvedValue("deleted-post");
            const req = getMockReq({
                params: {
                    postId: "test-id",
                },
            });
            const { res, next } = getMockRes();
            await deletePost(mockDBGetPostById, mockDBDeletePost)(
                req,
                res,
                next
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                data: "deleted-post",
            });
        });

        test("passes correct data to db.post.deletePost", async () => {
            const mockDBGetPostById = jest.fn().mockResolvedValue({});
            const mockDBDeletePost = jest.fn();
            const req = getMockReq({
                params: {
                    postId: "test-id",
                },
            });
            const { res, next } = getMockRes();
            await deletePost(mockDBGetPostById, mockDBDeletePost)(
                req,
                res,
                next
            );
            expect(mockDBDeletePost).toHaveBeenCalledWith(req.params.postId);
        });

        test("calls next() if an error occurs", async () => {
            const mockDBGetPostById = jest.fn().mockResolvedValue({});
            const mockDBDeletePost = jest.fn().mockImplementation(() => {
                throw new Error("error");
            });
            const req = getMockReq({
                params: {
                    postId: "test-id",
                },
            });
            const { res, next } = getMockRes();
            await deletePost(mockDBGetPostById, mockDBDeletePost)(
                req,
                res,
                next
            );
            expect(next).toHaveBeenCalledWith(new Error("error"));
        });

        test("returns 400 Bad Request if post doesn't exist", async () => {
            const mockDBGetPostById = jest.fn().mockResolvedValue(null);
            const mockDBDeletePost = jest.fn();
            const req = getMockReq({
                params: {
                    postId: "test-id",
                },
            });
            const { res, next } = getMockRes();
            await deletePost(mockDBGetPostById, mockDBDeletePost)(
                req,
                res,
                next
            );
            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockDBGetPostById).toHaveBeenCalledWith(req.params.postId);
            expect(mockDBDeletePost).not.toHaveBeenCalled();
        });

        test("returns 403 Forbidden if user is not the author of the post", async () => {
            const mockDBGetPostById = jest
                .fn()
                .mockResolvedValue({ userId: "the-author" });
            const mockDBDeletePost = jest.fn();
            const req = getMockReq({
                params: {
                    postId: "test-id",
                },
                session: {
                    user: {
                        id: "not-the-author",
                    },
                },
            });
            const { res, next } = getMockRes();
            await deletePost(mockDBGetPostById, mockDBDeletePost)(
                req,
                res,
                next
            );
            expect(res.status).toHaveBeenCalledWith(403);
            expect(mockDBGetPostById).toHaveBeenCalledWith(req.params.postId);
            expect(mockDBDeletePost).not.toHaveBeenCalled();
        });
    });

    // Search Ppublished posts
    // -------------------------------------------------------------------------
    describe("Search published posts controller:", () => {
        test("returns a function", () => {
            const mockQuery = jest.fn();
            expect(typeof searchPublishedPosts(mockQuery)).toBe("function");
        });

        test("returns 200 OK and the search results with valid inputs", async () => {
            const mockQuery = jest.fn().mockResolvedValue(["result"]);
            const req = getMockReq();
            const { res, next } = getMockRes();
            await searchPublishedPosts(mockQuery)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                data: ["result"],
            });
            expect(mockQuery).toHaveBeenCalled();
        });

        test("retrns 404 Not Found if there are no results", async () => {
            const mockQuery = jest.fn().mockResolvedValue([]);
            const req = getMockReq();
            const { res, next } = getMockRes();
            await searchPublishedPosts(mockQuery)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                status: "error",
                message: "No posts found",
            });
            expect(mockQuery).toHaveBeenCalled();
        });

        test("calls next() if an error occurs", async () => {
            const mockQuery = jest.fn().mockImplementation(() => {
                throw new Error("error");
            });
            const req = getMockReq();
            const { res, next } = getMockRes();
            await searchPublishedPosts(mockQuery)(req, res, next);
            expect(next).toHaveBeenCalledWith(new Error("error"));
            expect(res.status).not.toHaveBeenCalled();
        });

        test("builds query object and passes to db method correctly", async () => {
            const mockQuery = jest.fn().mockResolvedValue(["result"]);
            const req = getMockReq({
                body: {
                    category: "LEARN",
                    title: "Test Title",
                    tags: ["test", "tag"],
                    sortBy: "likes",
                },
            });
            const { res, next } = getMockRes();
            await searchPublishedPosts(mockQuery)(req, res, next);
            expect(mockQuery).toHaveBeenCalledWith({
                status: "PUBLISHED",
                category: "LEARN",
                title: "Test Title",
                tags: ["test", "tag"],
                sortBy: "likes",
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                data: ["result"],
            });
        });
    });
});
