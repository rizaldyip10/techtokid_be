import express from "express";
import { authControllers } from "../controllers";
import { signUpValidator } from "../middlewares/validator/validator";

const router = express.Router();

router.post("/sign-up", signUpValidator, authControllers.signUp);

export default router;