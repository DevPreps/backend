import * as yup from "yup";

export const validateUserId = {
    userId: yup.string().trim().required(),
};

export const validatePost = {
    title: yup.string().required(),
    content: yup.string().required(),
    catagory: yup.string().required(),
    companyName: yup.string(),
    city: yup.string(),
    jobTitle: yup.string(),
    position: yup.string(),
    jobadUrl: yup.string().trim(),
};
