import { faker } from "@faker-js/faker";

// Import TypeScript types
import { RegistrationData } from "../models/userModel";

export const fkRegistrationData = (): RegistrationData => {
    return {
        userName: faker.internet.userName(),
        email: faker.internet.email(),
        password: faker.internet.password(10, false, /\w/, "!Aa0"),
    };
};

export interface LoginData {
    email: string;
    password: string;
}

export const fkLoginData = (): LoginData => {
    return {
        email: faker.internet.email(),
        password: faker.internet.password(10, false, /\w/, "!Aa0"),
    };
};
