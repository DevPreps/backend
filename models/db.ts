import { prisma } from "./prisma";
import * as models from "./index";

const db = {
    user: models.userModel(prisma.user),
};

export default db;
