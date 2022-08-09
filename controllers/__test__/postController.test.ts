import { getMockReq, getMockRes } from "@jest-mock/express";
import { v4 } from "uuid";
import { createPost } from "../postController";
import { PostData } from "../../models/postModel";

describe("Unit Tests for Post Controllers", () => {

    beforeEach(() => {
        jest.resetAllMocks()
    })

    describe("CreatePost Controller:", () => {

        let mockPost: PostData;

        beforeEach(() => {
            mockPost = {
                userId: v4(),
                title: "test",
                content: "test",
                status: "DRAFT",
                category: "GENERAL",
            }
        })
        test("returns a function", () => {
            const mockDBCreatePost = jest.fn().mockResolvedValue({});
            expect(typeof createPost(mockDBCreatePost)).toBe("function");
        });

        test("returns 201 Created and the created post (valid inputs)", async () => {
            const mockDBCreatePost = jest.fn().mockResolvedValue({});
            const req = getMockReq({ body: mockPost });
            const { res, next } = getMockRes();
            await createPost(mockDBCreatePost)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(mockDBCreatePost).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ status: "success", data: {} });
        });

        test("calls next() if an error occurs", async () => {
            const mockDBCreatePost = jest.fn().mockImplementation(() => { throw new Error("error") });
            const req = getMockReq({ body: mockPost });
            const { res, next } = getMockRes();
            await createPost(mockDBCreatePost)(req, res, next);
            expect(next).toHaveBeenCalledWith(new Error("error"));
        })
    });
});
