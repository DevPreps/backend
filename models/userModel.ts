import { User as UserModel, PrismaClient } from "@prisma/client";

export interface User extends UserModel {
    // Custom methods
    register: () => void;
}

export interface UserData {
    userName: string,
    email: string,
    password: string,
}

const User = (prismaUser: PrismaClient["user"]) => {
    return Object.assign(prismaUser, {
        register: async (userData: UserData) => {
            return await prismaUser.create({
                data: userData,
            });
        },
    });
};

export default User;
