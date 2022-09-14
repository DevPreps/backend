import db from "../db";
import { possiblePositions } from "../../__test__/faker";

jest.mock("../prisma");

const positions = db.position;

describe("Unit Tests for Position Model:", () => {
    test("returns an object which contains prisma position functions", () => {
        expect(positions.count).toBeDefined();
        expect(positions.findMany).toBeDefined();
    });

    test("returns an object with custom methods", () => {
        expect(positions.getAllPositions).toBeDefined();
    });

    describe("Custom Methods:", () => {
        beforeEach(async () => {
            // Note: There is no need to clear the database between tests as the
            // prisma mock already does this

            // Create some positions in the database
            await positions.createMany({
                data: [...possiblePositions.map((t) => ({ positionTitle: t }))],
            });
            expect(await positions.count()).toBe(4);
        });

        // getAll Positions
        // -------------------------------------------------------------------------
        describe("positions.getAllPostitions:", () => {
            test("returns all positions from the database", async () => {
                const allPositions = await positions.getAllPositions();
                expect(allPositions).toHaveLength(4);
                expect(
                    allPositions
                        ?.map((p) => p.positionTitle)
                        .includes("DevOps Lead")
                ).toBe(true);
            });

            test("returns an empty array when there are no positions in the database", async () => {
                await positions.deleteMany({});
                expect(await positions.count()).toBe(0);
                const allPostitions = await positions.getAllPositions();
                expect(allPostitions).toEqual([]);
            });
        });
    });
});
