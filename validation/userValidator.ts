import * as yup from "yup";
import { emailValidator, passwordValidator, usernameValidator } from "./validationDefinition";

export const registerSchema = yup.object({
    email: emailValidator,
    password: passwordValidator,
    userName: usernameValidator,
});

export const loginSchema = yup.object({
    email: emailValidator,
    password: passwordValidator,
});
