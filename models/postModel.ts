import { Prisma, PrismaClient, Post, Status, Category } from "@prisma/client";
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
        getPostById: (id) => {
            return prismaPost.findUnique({
                where: {
                    id: id,
                },
                include: {
                    postTags: {
                        include: {
                            tag: true,
                        },
                    },
                    comments: true,
                    likes: true,
                },
            });
        },
        deletePost: (id) => {
            return prismaPost.delete({
                where: {
                    id: id,
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
    export type GetPostById = (id: string) => Promise<PostWithRetations | null>;
    export type DeletePost = (id: string) => Promise<Post>;
}

interface CustomMethods {
    createPost: PostMethods.CreatePost;
    getPostById: PostMethods.GetPostById;
    deletePost: PostMethods.DeletePost;
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

// Define type for posts including relationships to tags, likes and comments
const postWithRelations = Prisma.validator<Prisma.PostArgs>()({
    include: {
        postTags: { include: { tag: true } },
        comments: true,
        likes: true,
    },
});
export type PostWithRetations = Prisma.PostGetPayload<typeof postWithRelations>;
