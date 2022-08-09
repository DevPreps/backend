import * as registrationValidator from "yup";

export const registerSchema = registrationValidator.object({
    userName: registrationValidator.string().trim().required(),
    email: registrationValidator.string().email().trim().required(),
    password: registrationValidator.string().trim().min(4).max(10)
        // Minimum eight and maximum 10 characters, at least one uppercase letter, one lowercase letter, one number and one special characte
        // .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,10}$/)
        .required(),
});
