import db from "../db";

jest.mock("../prisma");

const tags = db.tag;

describe("Unit Tests for Tag Model:", () => {
    test("returns an object which contains prisma tag functions", () => {
        expect(tags.count).toBeDefined();
        expect(tags.findMany).toBeDefined();
    });
});