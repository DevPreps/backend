import * as validator from "yup";

const validateLogin = {
    email: validator.string().email().trim().required(),
    password: validator
        .string()
        .trim()
        // Minimum eight and maximum 10 characters, at least one uppercase letter, one lowercase letter, one number and one special characte
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-@$!%*?&])[A-Za-z\d-@$!%*?&]{6,15}$/)
        .required(),
};

export const registerSchema = validator.object({
    ...validateLogin,
    userName: validator.string().trim().required(),
});

export const loginSchema = validator.object(
    validateLogin,
);
