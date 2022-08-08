import { PrismaClient } from ".prisma/client";
import { execSync } from "child_process";
import { join } from "path";
import { URL } from "url";
import { v4 } from "uuid";

const generateDatabaseURL = (schema: string) => {
    if (!process.env.TEST_DB_URL) {
        throw new Error("please provide a database url");
    }
    const url = new URL(process.env.TEST_DB_URL);
    url.searchParams.append("schema", schema);
    return url.toString();
};

const schemaId = `test-${v4()}`;

const prismaBinary = join(
    __dirname,
    "..",
    "..",
    "node_modules",
    ".bin",
    "prisma"
);

const url = generateDatabaseURL(schemaId);
process.env.DB_URL = url;

export const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DB_URL } },
});

beforeAll(() => {
    execSync(`${prismaBinary} db push`, {
        env: {
            ...process.env,
            DB_URL: process.env.DB_URL,
        },
        // stdio: "inherit",
    });
    // console.log(`Database --> Connected to database: ${process.env.DB_URL}`);
});

afterEach(async () => {
    const tablenames = await prisma.$queryRaw<
        Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname=${schemaId}`;

    for (const { tablename } of tablenames) {
        if (tablename !== "_prisma_migrations") {
            try {
                await prisma.$executeRawUnsafe(
                    `TRUNCATE TABLE "${schemaId}"."${tablename}" CASCADE;`
                );
            } catch (error) {
                console.log({ error });
            }
        }
    }
});

afterAll(async () => {
    await prisma.$executeRawUnsafe(
        `DROP SCHEMA IF EXISTS "${schemaId}" CASCADE;`
    );

    await prisma.$disconnect();
    // console.log(`Database --> Disconnected from database: ${process.env.DB_URL}`);
});
