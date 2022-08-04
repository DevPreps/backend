import protect from "../routeProtector";
import { getMockReq, getMockRes } from "@jest-mock/express";

describe("Route Protector Middleware:", () => {
    test("exists", () => {
        expect(protect).toBeDefined();
    });

    test("returns a function", () => {
        expect(typeof protect({})).toBe("function");
    });

    test("passes control to the next middleware when all checks pass", () => {
        const req = getMockReq();
        const { res, next } = getMockRes();

        protect({})(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test("parameter { loggedIn: true } returns 401 Unauthorized if user not logged in", () => {
        const req = getMockReq({
            session: {},
        });
        const { res, next } = getMockRes();

        protect({ loggedIn: true })(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test("parameter { loggedIn: true } calls next() if user logged in", () => {
        const req = getMockReq({
            session: {
                user: {
                    id: "4730c0b6-7a4a-4b6f-801b-f539303dbae0",
                    firstName: null,
                    lastName: null,
                    userName: "loggedInUser",
                    email: "loggedin@email.com",
                    role: "USER",
                    isActive: null,
                    jobTitle: null,
                    positionId: null,
                    city: null,
                    imageUrl: null,
                    linkedIn: null,
                    github: null,
                },
                loggedIn: true,
            },
        });
        const { res, next } = getMockRes();

        protect({ loggedIn: true })(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test("param { loggedIn: false } calls next() if user not logged in", () => {
        const req = getMockReq({
            session: {},
        });
        const { res, next } = getMockRes();

        protect({ loggedIn: false })(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test("param { loggedIn: false } returns 401 Unauthorized if user logged in", () => {
        const req = getMockReq({
            session: {
                user: {
                    id: "4730c0b6-7a4a-4b6f-801b-f539303dbae0",
                    firstName: null,
                    lastName: null,
                    userName: "loggedInUser",
                    email: "loggedin@email.com",
                    role: "USER",
                    isActive: null,
                    jobTitle: null,
                    positionId: null,
                    city: null,
                    imageUrl: null,
                    linkedIn: null,
                    github: null,
                },
                loggedIn: true,
            },
        });
        const { res, next } = getMockRes();

        protect({ loggedIn: false })(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});

// takes an object and runs each key as a check with the value as the check's argument - Implement when there is more than one checker
