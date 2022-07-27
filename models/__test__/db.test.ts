import db from "../db";

describe("Unit Tests for Database Object:", () => {
    test("db object exitsts", () => {
        expect(db).toBeDefined();
    });

    test("contains user object with default and custom methods", () => {
        expect(db.user).toBeDefined();
        expect(typeof db.user).toBe("object");
        expect(db.user.count).toBeDefined();
        expect(db.user.register).toBeDefined();
    });
});
