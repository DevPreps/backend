import { Express } from "express"; // Types for Express
import app from "../app";
import supertest from "supertest";

import { prisma } from "../models/prisma";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";

jest.mock("../models/prisma");

let store: PrismaSessionStore;
let expressInstance: Express;
let request: supertest.SuperTest<supertest.Test>;

beforeEach(() => {
	// The code below initialises the test application in a way which allows the
	// database and session store to be shut down manually. This is necessary
	// to avoid the test application from leaking memory and allows Jest to exit
	// cleanly.
	store = new PrismaSessionStore(prisma, {
		checkPeriod: 10 * 60 * 1000, // 1 hour in milliseconds
		dbRecordIdIsSessionId: true,
	});
	expressInstance = app(store);
	request = supertest(expressInstance);
});

afterEach(() => {
	// Manual shutdown of the test application session store.
	// The DB connection is closed manually in the prisma mock file.
	store.shutdown();
});

describe("Route: '/'", () => {
	test("GET should respond with text: 'Hello World!'", async () => {
		const response = await request.get("/");
		expect(response.text).toBe("Hello World!");
		expect(response.status).toBe(200);
	});
});

describe("CORS", () => {
	it("should implement CORS", async () => {
		const { headers } = await request.get("/");
		expect(headers["access-control-allow-origin"]).toEqual("*");
	});
});
