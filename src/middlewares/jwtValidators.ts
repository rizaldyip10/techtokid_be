import { Request, Response } from "express";
import jwt, { Secret } from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            token?: string,
            userId: string,
        }
    }
}

export const jwtValidators = (req: Request, res: Response, next: Function) => {
    try {
        let token = req.headers.authorization;

        if (!token) throw { message: "Token is empty "};

        token = token.split(" ")[1];
        req.token = token;

        let verifiedUser = jwt.verify(token, process.env.JWT_SECRET_KEY as Secret) as { payload: string };
        req.userId = verifiedUser.payload;
        

        next();

    } catch (error: any) {
        res.status(500).send(error.message || "An error occured while doing authentication")
    }
}