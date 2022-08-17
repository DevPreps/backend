import * as yup from "yup";

export const emailValidator = yup.string().email().trim().required();
export const passwordValidator = yup.string().trim()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-@$!%*?&])[A-Za-z\d-@$!%*?&]{6,15}$/)
    .required();
export const usernameValidator = yup.string().trim().required();