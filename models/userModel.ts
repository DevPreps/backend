import { PrismaClient, User } from "@prisma/client";
import { prisma } from "./prisma";

// Create custom model with custom methods by combining prisma client and custom methods
const Users = (prismaUser: PrismaClient["user"]) => {
    const userMethods: CustomMethods = {
        register: (userData) => {
            return prismaUser.create({
                data: userData,
            });
        },
    };
    return Object.assign(prismaUser, userMethods);
};

// Generate the custom model
const userModel = Users(prisma.user);
export default userModel;

// List method types for the custom model and wrap in a namespace for simplified import
export namespace UserMethods {
    // Custom method types
    export type Register = (userData: RegistrationData) => Promise<User>;

    // Existing prisma generated user method types
    export type FindUnique = typeof userModel.findUnique;
}

export type UserWithoutPassword = Omit<User, 'password'>;

// Type object for custom methods used in this file only
interface CustomMethods {
    register: UserMethods.Register;
}

// Type objects for custom method inputs
export interface RegistrationData {
    userName: string;
    email: string;
    password: string;
}
