import * as yup from "yup";
import {
    emailValidator,
    passwordValidator,
    usernameValidator,
    userIdValidator,
} from "./validationDefinition";

export const registerSchema = yup
    .object({
        email: emailValidator,
        password: passwordValidator,
        userName: usernameValidator,
    })
    .noUnknown();

export const loginSchema = yup
    .object({
        email: emailValidator,
        password: passwordValidator,
    })
    .noUnknown();

export const userIdSchema = yup
    .object({
        userId: userIdValidator,
    })
    .noUnknown();
