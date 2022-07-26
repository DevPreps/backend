import express from "express";

// Import controllers
import { register, login } from "../controllers/authController";

const router = express.Router();

router.route('/register')
    .post(
        register()
    )

router.route('/login')
    .post(
        login()
    )

export default router