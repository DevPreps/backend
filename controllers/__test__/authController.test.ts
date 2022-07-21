// Import controllers
import { login } from "../authController";

describe("Unit Tests for AUTH controllers", () => {
    describe("Login controller:", () => {

        test("returns a function", () => {
            expect(typeof login()).toBe("function")
        })
        
    })
})