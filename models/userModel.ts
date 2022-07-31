import { PrismaClient, Prisma, User } from "@prisma/client";
import { prisma } from "./prisma";

// Create custom model with custom methods by combining prisma client and custom methods
const Users = (prismaUser: PrismaClient["user"]) => {
    const userMethods: CustomMethods = {

        register: (registrationData) => {
            return prismaUser.create({
                data: registrationData,
            });
        },

        getUserByEmail: (email) => {
            return prismaUser.findUnique({
                where: { email: email },
            });
        },

        getUserByUserName: (userName) => {
            return prismaUser.findUnique({
                where: { userName: userName}
            });
        },

        getCredentials: (email) => {
            return prismaUser.findUnique({
                where: { email: email },
                select: { email: true, password: true },
            })
        }
    };
    return Object.assign(prismaUser, userMethods);
};

// Generate the custom model
const userModel = Users(prisma.user);
export default userModel;

// List method types for the custom model and wrap in a namespace for simplified import
export declare namespace UserMethods {
    // Custom method types
    export type Register = (
        registrationData: RegistrationData
    ) => Promise<User>;

    export type GetUserByEmail =    (email: string) => Promise<User | null>;
    export type GetUserByUserName = (userName: string) => Promise<User | null>;
    export type GetCredentials =    (email: string) => Promise<{ email: string, password: string } | null>

    // Existing prisma generated user method types
    export type FindUnique = typeof userModel.findUnique;
}

export type UserWithoutPassword = Omit<User, "password">;

// Type object for custom methods used in this file only
interface CustomMethods {
    register: UserMethods.Register;
    getUserByEmail: UserMethods.GetUserByEmail;
    getUserByUserName: UserMethods.GetUserByUserName;
    getCredentials: UserMethods.GetCredentials;
}

// Type objects for custom method inputs
export interface RegistrationData {
    userName: string;
    email: string;
    password: string;
}
