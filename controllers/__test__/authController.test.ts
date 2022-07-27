// Import controllers
import { register, login } from "../authController";
import { Register } from "../../models/userModel";


beforeEach(() => {
    jest.resetAllMocks();
});

describe("Unit Tests for AUTH controllers", () => {

    describe("Register controller:", () => {

        test("returns a function", async () => {
            expect(typeof register(jest.fn().mockResolvedValue({}))).toBe("function");
        });

        test("returns a 201 CREATED response with valid inputs", () => {
            // Mock return user
            const mockReturnUser = {
                id: '4730c0b6-7a4a-4b6f-801b-f539303dbae0',
                firstName: null,
                lastName: null,
                userName: 'bumblebee',
                email: 'johndoe@gmail.com',
                role: 'USER',
                isActive: null,
                jobTitle: null,
                positionId: null,
                city: null,
                imageUrl: null,
                linkedIn: null,
                github: null
              }
            // Provide a mock db method to register()
            const mockRegister = jest.fn().mockResolvedValue(mockReturnUser) as Register

            const req: any = {
                body: {
                    "userName": "bumblebee",
                    "email": "johndoe@gmail.com",
                    "password": "password"
                }
            };
            const res: any = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            }
            const next = jest.fn();
            
            register(mockRegister)(req, res, next);
            // console.log(res)
            expect(res.status).toHaveBeenCalledWith(201);
            // expect(res.json).toHaveBeenCalledWith(mockReturnUser);
        });
    });

    describe("Login controller:", () => {
        test("returns a function", () => {
            expect(typeof login()).toBe("function");
        });
    });
});
