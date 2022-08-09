import * as yup from "yup"; 

export const registerSchema = yup.object({
    userName: yup.string()
        .trim()
        .required(),
    email: yup.string().email().trim().required(),
    password: yup.string().trim().min(4).max(10)
        // Minimum eight and maximum 10 characters, at least one uppercase letter, one lowercase letter, one number and one special characte
        // .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{4,10}$/)
        .required(),
});
