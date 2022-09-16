import * as yup from "yup";
import db from "../models/db";

// Checks that the position is one of the allowed values
const positionValid: [string, string, (value: any) => Promise<boolean>] = [
    "positionInvalid",
    "The position supplied is invalid",
    async (value) => {
        // If falsey then pass test as field is optional.
        if (!value) return true;
        const positions = await db.position.getAllPositions();
        const positionTitles = positions?.map((p) => p.positionTitle);
        if (positionTitles?.includes(value)) return true;
        return false;
    },
];

// Checks that all postTags are valid
const postTagsValid: [string, string, (value: any) => Promise<boolean>] = [
    "postTagsInvalid",
    "One or more of the tags supplied is invalid",
    async (value) => {
        const tags = await db.tag.getAllTags();
        const tagNames = tags?.map((tag) => tag.name);
        // Reduce has been used to check if the supplied tags exist in the database.
        // This method allows us to explicity return when a tag is not found and prevent
        // the controller from continuing.
        const tagsExist = value.reduce((tagExists: boolean, tag: string) => {
            if (!tagNames?.includes(tag)) {
                return tagExists && false;
            }
            return tagExists && true;
        }, true);

        return tagsExist;
    },
];

export const postSchema = yup
    .object({
        title: yup
            .string()
            .required()
            .min(4, "The title of a post should be at least 4 characters long")
            .max(
                250,
                "The title of a post shoule be shorter than 250 characters"
            ),
        content: yup
            .string()
            .required()
            .max(
                10000,
                "Post content should be less than 10,000 characters long"
            ),
        status: yup.string().required().oneOf(["PUBLISHED", "DRAFT"]),
        category: yup
            .string()
            .required()
            .oneOf(["GENERAL", "INTERVIEW", "LEARN", "PROJECT"]),
        companyName: yup
            .string()
            .optional()
            .min(3, "Company name should be at least 3 characters")
            .max(250, "Company name should be shorter than 250 characters"),
        city: yup
            .string()
            .optional()
            .min(2, "City should be at least 2 characters long")
            .max(100, "City should be shorter than 100 characters"),
        jobTitle: yup
            .string()
            .optional()
            .min(5, "Job title should be longer than 4 characters long")
            .max(250, "Job title should be shorter than 250 characters"),
        position: yup
            .string()
            .optional()
            .test(...positionValid),
        jobAdUrl: yup.string().optional().url().trim(),
        postTags: yup
            .array(yup.string().min(1))
            .required()
            .min(1, "You must provide at least one tag for the post")
            .test(...postTagsValid),
    })
    .noUnknown();
