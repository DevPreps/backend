import { PrismaClient, Tag } from "@prisma/client";
import { prisma } from "./prisma";

const Tags = (prismaTag: PrismaClient["tag"]) => {
    const customMethods: CustomMethods = {
        getAllTags: async () => {
            return prismaTag.findMany({});
        }
    };

    return Object.assign(prismaTag, customMethods);
};

const tagModel = Tags(prisma.tag);

export default tagModel;


export declare namespace TagMethods {
    export type GetAllTags = () => Promise<Tag[] | null>;
}

interface CustomMethods {
    getAllTags: TagMethods.GetAllTags;
}