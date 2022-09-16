import { Prisma, PrismaClient, Status, Category } from "@prisma/client";
import { prisma } from "./prisma";

const getTagIds = async (postTags: string[]) => {
    const tags = await prisma.tag.findMany({});
    const tagIds = postTags?.map((tag) => {
        return { tagId: tags?.filter((t) => t.name === tag)[0].id };
    });
    return tagIds;
};

const Posts = (prismaPost: PrismaClient["post"]) => {
    const customMethods: CustomMethods = {
        createPost: async (postData) => {
            const tagIds = await getTagIds(postData.postTags);
            return prismaPost.create({
                data: {
                    ...postData,
                    postTags: {
                        createMany: {
                            data: tagIds,
                        },
                    },
                },
                include: {
                    postTags: {
                        include: {
                            tag: true,
                        },
                    },
                    likes: true,
                    comments: true,
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
        updatePost: async (postId, postData) => {
            const post = await prismaPost.findUnique({
                where: {
                    id: postId,
                },
            });

            if (!post) return null;

            const tagIds = getTagIds(postData.postTags);

            return prismaPost.update({
                where: {
                    id: postId,
                },
                data: {
                    ...postData,
                    postTags: {
                        deleteMany: {
                            postId: postId,
                        },
                        createMany: {
                            data: await tagIds,
                        },
                    },
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
                include: {
                    postTags: {
                        include: {
                            tag: true,
                        },
                    },
                    likes: true,
                    comments: true,
                },
            });
        },
        search: async ({ category, status, title, tags, sortBy }) => {
            // Get tag objects from tag names
            const tagObjs = tags ? await getTagIds(tags) : null;

            return prismaPost.findMany({
                where: {
                    ...(category ? { category: category } : {}),
                    ...(status === "ALL"
                        ? {}
                        : status === "DRAFT"
                        ? { status: "DRAFT" }
                        : { status: "PUBLISHED" }),
                    ...(title ? { title: { contains: title } } : {}),
                    ...(tags
                        ? {
                              postTags: {
                                  some: {
                                      tagId: {
                                          in: tagObjs?.map((tag) => tag.tagId),
                                      },
                                  },
                              },
                          }
                        : {}),
                },
                include: {
                    postTags: {
                        include: {
                            tag: true,
                        },
                    },
                    likes: true,
                    comments: true,
                },
                orderBy: {
                    ...(sortBy === "likes"
                        ? { likes: { _count: "desc" } }
                        : { createdDate: "desc" }),
                },
            });
        },
    };

    return Object.assign(prismaPost, customMethods);
};

const postModel = Posts(prisma.post);
export default postModel;

export declare namespace PostMethods {
    export type CreatePost = (
        postData: PostData
    ) => Promise<PostWithRelations | null>;
    export type GetPostById = (id: string) => Promise<PostWithRelations | null>;
    export type UpdatePost = (
        id: string,
        postData: PostData
    ) => Promise<PostWithRelations | null>;
    export type DeletePost = (id: string) => Promise<PostWithRelations>;
    export type Search = (
        queryParams: QueryParams
    ) => Promise<PostWithRelations[]>;
}

interface CustomMethods {
    createPost: PostMethods.CreatePost;
    getPostById: PostMethods.GetPostById;
    updatePost: PostMethods.UpdatePost;
    deletePost: PostMethods.DeletePost;
    search: PostMethods.Search;
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

export interface QueryParams {
    category?: Category;
    status?: string;
    title?: string;
    tags?: string[];
    sortBy?: string;
}

// Define type for posts including relationships to tags, likes and comments
const postWithRelations = Prisma.validator<Prisma.PostArgs>()({
    include: {
        postTags: { include: { tag: true } },
        comments: true,
        likes: true,
    },
});
export type PostWithRelations = Prisma.PostGetPayload<typeof postWithRelations>;
