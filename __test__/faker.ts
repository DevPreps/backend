import { faker } from "@faker-js/faker";

// Import TypeScript types
import { RegistrationData } from "../models/userModel";
import { PostData } from "../models/postModel";

export const possibleTags = ["JS", "TS", "GraphQL", "React", "Vue", "Java"];

export const fkRegistrationData = (): RegistrationData => {
    return {
        userName: faker.internet.userName(),
        email: faker.internet.email(),
        password: faker.internet.password(10, false, /\w/, "!Aa0"),
    };
};

export interface LoginData {
    email: string;
    password: string;
}

export const fkLoginData = (): LoginData => {
    return {
        email: faker.internet.email(),
        password: faker.internet.password(10, false, /\w/, "!Aa0"),
    };
};

/**
 * ### fkPostData()
 *
 * Generates a random set of data to be used to create a post
 * userId must be provided in the params object for the post to be created.
 * All other fields are optional and will be generated randomly. If a field is
 * provided in the params object, that value will be used instead of a random
 * value.
 *
 * @param {Partial<PostData>} params - An object with data to be used to create a post
 *
 * @returns {PostData} An object with random data to be used to create a post
 *
 * #### Examples:
 * ##### Generate a post with random data
 * ```
 * const postData = fkPostData({
 *   userId: user.id,
 * });
 * ```
 */
export const fkPostData = (params: Partial<PostData>): PostData => {
    return {
        userId: params?.userId as string,
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(4),
        status: faker.helpers.arrayElement(["DRAFT", "PUBLISHED"]),
        category: faker.helpers.arrayElement([
            "GENERAL",
            "LEARN",
            "INTERVIEW",
            "PROJECT",
        ]),
        postTags: faker.helpers.arrayElements(possibleTags),
        ...params,
    };
};
