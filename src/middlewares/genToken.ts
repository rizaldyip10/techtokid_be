import jwt, { Secret } from "jsonwebtoken";

export const generateToken = (payload: string, expiresIn: string) => {
    
    return jwt.sign({ payload }, process.env.JWT_SECRET_KEY as Secret, { expiresIn });
}

export default generateToken;