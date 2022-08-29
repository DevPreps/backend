import "./testSetup";
import axios from "axios";

// Middleware tests
// ----------------------------------------------------------------------------

describe("CORS", () => {
    it("should implement CORS", async () => {
        const response = await axios.get("/");
        expect(response.headers["access-control-allow-origin"]).toEqual("*");
    });
});

describe("Rate limit", () => {
    beforeAll(() => {
        // Change operating environment just for this test as rate limiter is disabled for test environment
        process.env.NODE_ENV = "development";
        expect(process.env.NODE_ENV).toEqual("development");
    });

    afterAll(() => {
        // Reset operating environment
        process.env.NODE_ENV = "test";
        expect(process.env.NODE_ENV).toEqual("test");
    });

    it("Should allow no more than 2 requests per second", async () => {
        const response1 = await axios.get("/");
        const response2 = await axios.get("/");
        const response3 = await axios.get("/");
        expect(response1.status).toBe(200);
        expect(response2.status).toBe(200);
        expect(response3.status).toBe(429);
    });
});
