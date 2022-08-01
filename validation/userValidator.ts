import * as yup from 'yup'; 

export const userSchema = yup.object({
    firstName: yup.string().trim().required(),
    lastName: yup.string().trim().required(),
    userName: yup.string().trim().required(),
    email: yup.string().email().trim().required(),
    password: yup.string().trim().min(4).max(10).required(),
    role: yup.string().trim().required(),
});
