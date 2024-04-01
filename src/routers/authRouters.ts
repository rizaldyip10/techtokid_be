import express from "express";
import { authControllers } from "../controllers";
import { signUpValidator } from "../middlewares/validator/validator";
import { jwtValidators } from "../middlewares/jwtValidators";

const router = express.Router();

router.post("/sign-up", signUpValidator, authControllers.signUp);
router.patch("/verify-account", jwtValidators, authControllers.accountVerif);

export default router;