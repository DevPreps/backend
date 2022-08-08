import errorHandler from '../errorHandler';
import { getMockReq, getMockRes } from "@jest-mock/express";

describe("(Unit tests) Custom Error Handler:", () => {
    test("Returns a function", () => {
        expect(typeof errorHandler()).toBe("function");
    });

    test("returns a 500 Internal Server Error if an error occurs", async () => {
        const error = new Error("Test error");
        const req = getMockReq();
        const { res, next } = getMockRes();
        
        await errorHandler()(error, req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
        
    });
});