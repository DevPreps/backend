import { PrismaClient, User } from "@prisma/client";

export type Register = (userData: UserData) => Promise<User>;

interface UserMethods {
    register: Register;
}

export interface UserData {
    userName: string;
    email: string;
    password: string;
}

const User = (prismaUser: PrismaClient["user"]) => {
    const userMethods: UserMethods = {
        register: (userData) => {
            return prismaUser.create({
                data: userData,
            });
        },
    };
    return Object.assign(prismaUser, userMethods);
};

export default User;
