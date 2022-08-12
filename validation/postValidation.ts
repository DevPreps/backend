import * as validator from "yup";

export const validateUserId = {
    userId: validator.string().trim().required(),
};

export const validatePost = {
    title: validator.string().required(),
    content: validator.string().required(),
    catagory: validator.string().required(),
    companyName: validator.string(),
    city: validator.string(),
    jobTitle: validator.string(),
    position: validator.string(),
    jobadUrl: validator.string().trim(),
};
