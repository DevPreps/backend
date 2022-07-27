import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { join } from "path";

const prismaBinary = join(
    __dirname,
    "..",
    "..",
    "node_modules",
    ".bin",
    "prisma"
);
const url = process.env.TEST_DB_URL;

export const prisma = new PrismaClient({
    datasources: { db: { url } },
});

beforeAll(() => {
    execSync(`${prismaBinary} db push`, {
        env: {
            ...process.env,
            DB_URL: url,
        }, //,
        // stdio: "inherit",
    });
    // console.log(`Database --> Connected to database: ${url}`);
});

afterEach(async () => {
    const tablenames = await prisma.$queryRaw<
        Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    for (const { tablename } of tablenames) {
        if (tablename !== "_prisma_migrations") {
            try {
                await prisma.$executeRawUnsafe(
                    `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
                );
            } catch (error) {
                console.log({ error });
            }
        }
    }
});

afterAll(async () => {
    await prisma.$disconnect();
    // console.log(`Database --> Disconnected from database: ${url}`);
});
