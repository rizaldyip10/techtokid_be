import express from "express";
import { authControllers } from "../controllers";
import { loginValidator, signUpValidator } from "../middlewares/validator/validator";
import { jwtValidators } from "../middlewares/jwtValidators";

const router = express.Router();

router.post("/sign-up", signUpValidator, authControllers.signUp);
router.patch("/verify-account", jwtValidators, authControllers.accountVerif);
router.get("/login", loginValidator, authControllers.login);
router.get("/keep-login", jwtValidators, authControllers.keepLogin);
router.post("/google-auth", authControllers.googleAuth);
router.put("/password-recovery", authControllers.passRecovery);

export default router;