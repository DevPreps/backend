import { PrismaClient, User } from "@prisma/client";
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
                where: { userName: userName },
            });
        },

        getCredentials: (email) => {
            return prismaUser.findUnique({
                where: { email: email },
                select: { email: true, password: true },
            });
        },

        updateUser: (userId, updateData) => {
            return prismaUser.update({
                data: updateData,
                where: { id: userId },
            });
        },
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
    export type GetUserByEmail = (email: string) => Promise<User | null>;
    export type GetUserByUserName = (userName: string) => Promise<User | null>;
    export type GetCredentials = (
        email: string
    ) => Promise<{ email: string; password: string } | null>;
    export type UpdateUser = (
        id: string | undefined,
        updateData: UpdateData
    ) => Promise<User>;

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
    updateUser: UserMethods.UpdateUser;
}

// Type objects for custom method inputs
export interface RegistrationData {
    userName: string;
    email: string;
    password: string;
}

/**
 * __This interface is made for the UpdateUser endpoint in the UserController.__
 *
 * **UpdateData** builds on the mandatory fields in **RegistrationData**:
 * - userName: string;
 * - email: string;
 * - password: string;
 *
 * These fields are mandatory however the **UpdateData** interface includes
 * __optional types__ that make up the user's personal and profile information:
 * firstName, lastName, jobTitle, city, imageUrl, linkenIn,
 * github.
 *
 * These fields all have a type = string | underfined.
 */
export interface UpdateData extends RegistrationData {
    firstName?: string;
    lastName?: string;
    jobTitle?: string;
    city?: string;
    imageUrl?: string;
    linkedIn?: string;
    github?: string;
}
