import { Request, Response } from "express";
import db from "../db";
import bcrypt from "bcrypt";
import generateToken from "../middlewares/genToken";
import fs from "fs";
import Handlebars from "handlebars";
import transporter from "../middlewares/transporter";
import path from "path";

const authControllers = {
    signUp: async (req: Request, res: Response) => {
        try {
            const { name, email, password, feURL } = req.body as unknown as { name: string, email: string, password: string, feURL: string };
            
            let username = name.split(" ")[0];
        
            const [isEmailExist, isUsernameExist] = await db.$transaction([
                db.user.findFirst({
                    where: { email }
                }),
                
                db.user.findFirst({
                    where: { username }
                })
            ]);
            
            if (isUsernameExist) {
                username += Math.random().toString(36).substring(2, 6);
            };

            if (isEmailExist) {
                throw { message: "Email already used. Please choose another email" };
            };

            
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
            
            const { id } = newUser
            const token = generateToken(id, "1d");

            const data = fs.readFileSync(path.join(__dirname, "../templates/register.html"), "utf-8");
            const tempCompile = await Handlebars.compile(data);
            const tempResult = tempCompile({ token, feURL });

            await transporter.sendMail({
                from: process.env.USER_MAILER,
                to: email,
                subject: 'Account Verification',
                html: tempResult
            });

            res.status(200).send({
                status: true,
                message: "Account successfully created!",
                token,
            });

        } catch (error: any) {
            console.log(error);
            res.status(500).send({
                status: false,
                message: error.message || "An error occured while creating your account"
            });
        }
    },
    accountVerif: async (req: Request, res: Response) => {
        try {
            const checkUser = await db.user.findFirst({
                where: {
                    id: req.userId
                }
            });

            if (checkUser?.isVerified) throw { message: "Account already verified" };

            await db.user.update({
                data: {
                    isVerified: true
                },
                where: {
                    id: req.userId
                }
            });
            
            res.status(200).send({
                status: true,
                message: "Verifying account success"
            })
            
        } catch (error: any) {
            res.status(500).send({
                status: false,
                message: error.message || "An error occured when verifying your account"
            })
        }
    }
};

export default authControllers;