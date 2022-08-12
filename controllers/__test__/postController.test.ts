import { getMockReq, getMockRes } from "@jest-mock/express";
import { v4 } from "uuid";
import { createPost } from "../postController";

describe("Unit Tests for Post Controllers", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("CreatePost Controller:", () => {
        test("returns a function", () => {
            const mockDBCreatePost = jest.fn().mockResolvedValue({});
            expect(typeof createPost(mockDBCreatePost)).toBe("function");
        });

        test("inputs passed correctly to db method", async () => {
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
            const req = getMockReq();
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
            const req = getMockReq();
            const { res, next } = getMockRes();
            await createPost(mockDBCreatePost)(req, res, next);
            expect(next).toHaveBeenCalledWith(new Error("error"));
        });
    });
});
