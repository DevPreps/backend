import * as yup from "yup";

export const emailValidator = yup.string().required().email().trim();
export const passwordValidator = yup
    .string()
    .required()
    .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-@$!%*?&])[A-Za-z\d-@$!%*?&]{6,15}$/
    )
    .trim();
export const usernameValidator = yup
    .string()
    .required()
    // allowed : lower case, upper case, number, ".", "-", "_"
    // start and end with alphanumeric characters
    // ".", "-", "_" do not appear consecutively
    .matches(/^[a-zA-Z0-9]([._-](?![._-])|[a-zA-Z0-9]){4,16}[a-zA-Z0-9]$/) // ex) abc_d-e.f3
    .trim();
export const userIdValidator = yup.string().uuid();
