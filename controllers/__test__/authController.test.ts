// Import controllers
import { register, login } from "../authController";

describe("Unit Tests for AUTH controllers", () => {
    describe("Register controller:", () => {
        test("returns a function", () => {
            expect(typeof register()).toBe("function");
        });

        test("returns a 201 CREATED response with valid inputs", () => {
            const req: any = {};
            const res: any = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis(),
            };
            const next = jest.fn();
            register()(req, res, next);
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe("Login controller:", () => {
        test("returns a function", () => {
            expect(typeof login()).toBe("function");
        });
    });
});
