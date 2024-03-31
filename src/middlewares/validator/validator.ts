import { body, validationResult } from "express-validator";
import { Request, Response } from "express";

export const signUpValidator = async (req: Request, res: Response, next: Function) => {
    try {
        await body('name')
            .notEmpty().withMessage("Your name is required, please fill your name.")
            .run(req);
        await body('email')
            .notEmpty().withMessage("Please enter your email.")
            .run(req);
        await body('password')
            .notEmpty().withMessage("Please enter your password.")
            .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
            .withMessage("Please create password with minimum 8 characters, 1 uppercase, 1 number, and 1 symbol.")
            .run(req);

        const validation = validationResult(req);
        
        if (validation.isEmpty()) {
            next();
        } else {
            res.status(403).send({
                status: false,
                message: "Invalid validation, please check your input again.",
                error: validation.array()
            });
        };
    } catch (error: any) {
        res.status(500).send(error.message || "An error occured when creating your account.");
    }
}