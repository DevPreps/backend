import { PrismaClient, Post, Status, Category } from "@prisma/client";
import { prisma } from "./prisma";

const Posts = (prismaPost: PrismaClient["post"]) => {
    const customMethods: CustomMethods = {
        createPost: (postData) => {
            // const tagIds = postData?.postTags?.map(tag => ({ 
            //     tagId: prisma.tag.findUnique({
            //         where: { name: tag }
            //     })
            // }));
            // console.log(tagIds);

            return prismaPost.create({ 
                data: {
                    ...postData,
                    // postTags: {
                    //     createMany: {
                    //         data: tagIds
                    //     }
                    // }
                }
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
    // postTags: string[];
}
