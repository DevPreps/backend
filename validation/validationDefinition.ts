import * as yup from "yup";

export const emailValidator = yup.string().email().trim().required();
export const passwordValidator = yup.string().trim()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-@$!%*?&])[A-Za-z\d-@$!%*?&]{6,15}$/)
    .required();
export const usernameValidator = yup.string().trim()
    // allowed : lower case, upper case, number, ".", "-", "_" 
    // start and end with alphanumeric characters
    // ".", "-", "_" do not appear consecutively
    .matches(/^[a-zA-Z0-9]([._-](?![._-])|[a-zA-Z0-9]){4,16}[a-zA-Z0-9]$/) // ex) abc_d-e.f3
    .required();
export const userIdValidator = yup.string().uuid();
