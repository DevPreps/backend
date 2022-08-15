import { PrismaClient, Post, Status, Category } from "@prisma/client";
import { prisma } from "./prisma";

const Posts = (prismaPost: PrismaClient["post"]) => {
    const customMethods: CustomMethods = {
        createPost: async (postData) => {
            const tags = await prisma.tag.findMany({});
            const tagIds = postData?.postTags?.map((tag) => {
                return { tagId: tags?.filter((t) => t.name === tag)[0].id };
            });

            return prismaPost.create({
                data: {
                    ...postData,
                    postTags: {
                        createMany: {
                            data: tagIds,
                        },
                    },
                },
            });
        },
    };

    return Object.assign(prismaPost, customMethods);
};

const postModel = Posts(prisma.post);
export default postModel;

export declare namespace PostMethods {
    export type CreatePost = (postData: PostData) => Promise<Post | null>;
}

interface CustomMethods {
    createPost: PostMethods.CreatePost;
}

export interface PostData {
    userId: string;
    title: string;
    content: string;
    status: Status;
    category: Category;
    companyName?: string;
    city?: string;
    jobTitle?: string;
    position?: string;
    jobAdUrl?: string;
    postTags: string[];
}
