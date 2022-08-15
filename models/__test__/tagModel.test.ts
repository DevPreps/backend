import db from "../db";

jest.mock("../prisma");

const tags = db.tag;

describe("Unit Tests for Tag Model:", () => {
    test("returns an object which contains prisma tag functions", () => {
        expect(tags.count).toBeDefined();
        expect(tags.findMany).toBeDefined();
    });

    test("returns an object with custom methods", () => {
        expect(tags.getAllTags).toBeDefined();
    });

    describe("Custom Methods:", () => {
        // Get all tags
        // -------------------------------------------------------------------------
        test("tags.getAllTags returns all tags in the database", async () => {
            // Create some tags in the database
            await tags.createMany({
                data: [{ name: "JS" }, { name: "TS" }, { name: "GraphQL" }],
            });
            expect(await tags.count()).toBe(3);

            const result = await tags.getAllTags();
            expect(result?.length).toBe(3);
        });
    });
});
