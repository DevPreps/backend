import { prisma } from "./prisma";
import userModel from "./userModel";

//// Implement Prisma middleware

// Remove password from the user object
prisma.$use(async (params, next) => {
    let result = await next(params);
    if (params?.model === "User" && params?.args?.select?.password !== true) {
        if (Array.isArray(result)) {
            result = result.map((user) => {
                delete user.password;
                return user;
            });
        } else {
            delete result?.password;
        }
    }
    return result;
});

//// Override the default Prisma client with custom model methods
const db = {
    user: userModel,
};

export default db;
