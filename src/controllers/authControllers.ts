import { Request, Response } from "express";
import db from "../db";
import bcrypt from "bcrypt";
import generateToken from "../middlewares/genToken";

const authControllers = {
    signUp: async (req: Request, res: Response) => {
        try {
            const { name, email, password } = req.body as unknown as { name: string, email: string, password: string };
            
            let username = name.split(" ")[0];
        
            const [isEmailExist, isUsernameExist] = await db.$transaction([
                db.user.findUnique({
                    where: { email }
                }),
                
                db.user.findUnique({
                    where: { username }
                })
            ]);
            
            if (isUsernameExist) {
                username += Math.random().toString(36).substring(2, 6);
            };

            if (isEmailExist) {
                throw new Error("Email already used. Please choose another email");
            };

            const token = generateToken(email, "1d");

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = await db.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    username,
                    isVerified: false,
                    roleId: 1
                }
            });

            res.status(200).send({
                status: true,
                message: "Account successfully created!",
                token,
            });

        } catch (error: any) {
            console.log(error);
            res.status(500).send(error.message || "An error occured while creating your account");
        }
    }
};

export default authControllers;