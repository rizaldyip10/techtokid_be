import { Request, Response } from "express";
import { genUsername } from "../middlewares/genUsername";
import { getAuth } from "firebase-admin/auth";
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
            
            let username = await genUsername(email);
        
            const isEmailExist = await db.user.findFirst({
                where: {
                    email
                }
            });

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
                    roleId: 1,
                    google_auth: false
                }
            });
            
            const { id } = newUser;
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
        };
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
                    isVerified: true,
                    verifyToken: req.token
                },
                where: {
                    id: req.userId
                }
            });
            
            res.status(200).send({
                status: true,
                message: "Verifying account success"
            });
            
        } catch (error: any) {
            res.status(500).send({
                status: false,
                message: error.message || "An error occured when verifying your account"
            });
        };
    },
    login: async (req: Request, res: Response) => {
        try {
            const { data, password } = req.body;

            const isUserExist = await db.user.findFirst({
                where: {
                    OR: [{ email: data }, { username: data }]
                }
            });

            if (!isUserExist) {
                throw { message: "Please enter your email or username correctly" }
            };

            if (!isUserExist.verifyToken) {
                throw { message: "Your account is not verified, please verify your account" }
            };

            if (isUserExist.password === null || isUserExist.password === undefined && isUserExist.google_auth) {
                throw { message: "Your account is registered using google auth. Please log in using google" }
            }

            const isValid = bcrypt.compare(password, isUserExist?.password);

            if (!isValid) throw { message: "Incorrect password" };

            const token = generateToken(isUserExist.id, "6h");

            res.status(200).send({
                status: true,
                result: isUserExist,
                token
            });

        } catch (error: any) {
            res.status(500).send({
                status: false,
                message: error.message || "An error occured when logging in to your account."
            });
        };
    },
    keepLogin: async (req: Request, res: Response) => {
        try {
            const result = await db.user.findFirst({
                where: {
                    id: req.userId
                },
                select: {
                    username: true,
                    roleId: true,
                    profileImg: true,
                    name: true,
                    id: true,
                    google_auth: true
                }
            });

            if (!result) throw { message: "Error in retrieving user data" };


        } catch (error: any) {
            res.status(500).send({
                status: false,
                message: error.message || "Error in retrieving user data"
            })
        };
    },
    googleAuth: async (req: Request, res: Response) => {
        try {
            const { google_token } = req.body;

            let decodeUser = await getAuth().verifyIdToken(google_token);

            if (!decodeUser || !decodeUser.email || !decodeUser.picture) {
                throw { message: "Invalid or missing user data from Google token" };
            };

            let { email, name, picture } = decodeUser;

            picture = picture.replace("s96-c", "s384-c")

            const isEmailExist = await db.user.findFirst({
                where: { email }
            });

            if (isEmailExist) throw { message: "Email already used, please use another email" };
          
            let username = await genUsername(email);

            const newUser = await db.user.create({
                data: {
                    name,
                    email,
                    profileImg: picture,
                    username,
                    isVerified: true,
                    verifyToken: google_token,
                    roleId: 1,
                    google_auth: true
                },
                select: {
                    username: true,
                    roleId: true,
                    profileImg: true,
                    name: true,
                    id: true,
                    google_auth: true
                }
            });

            const token = generateToken(newUser.id, "2d")

            res.status(200).send({
                status: false,
                message: "Account successfully created",
                result: newUser,
                token
            });

        } catch (error: any) {
            res.status(500).send({
                status: false,
                message: error.message || "An error occured when connecting to your google-account"
            });
        };
    },
    passRecovery: async (req: Request, res: Response) => {
        try {
            const { email, feURL } = req.body;

            const isEmailExist = await db.user.findFirst({
                where: { email }
            });

            if (!isEmailExist) throw { message: "Email not found, please input your valid email" };

            const token = generateToken(isEmailExist.id, "1d");

            const data = fs.readFileSync(path.join(__dirname, "../templates/reset.html"), "utf-8");
            const tempCompile = await Handlebars.compile(data);
            const tempResult = tempCompile({ token, feURL });

            await transporter.sendMail({
                from: process.env.USER_MAILER,
                to: email,
                subject: 'Reset Account Password',
                html: tempResult
            });

            res.status(200).send({
                status: true,
                message: "Please check your email to reset password",
                token
            });
        } catch (error: any) {
            res.status(500).send({
                status: false,
                message: error.message || "An error occured when trying to send password recovery email"
            })
        };
    },
    resetPass: async (req: Request, res: Response) => {
        try {
            const { password, confrimPassword } = req.body;

            if (password != confrimPassword) throw { message: "Password not match" };

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await db.user.update({
                data: { password: hashedPassword },
                where: { id: req.userId }
            });

            res.status(200).send({
                status: true,
                message: "Password successfully changed"
            })

        } catch (error: any) {
            res.status(500).send({
                status: false,
                message: error.message || "An error occured when changing your password"
            })
        };
    }
};

export default authControllers;