import express, { Request, Response } from "express";
import * as admin from "firebase-admin";
import dotenv from "dotenv"

import { authRouters } from "./routers";

dotenv.config();
const app = express();
app.use(express.json());

const serviceAccount = process.env.SERVICE_ACCOUNT_FIREBASE

if (!serviceAccount) {
    console.log("Error: SERVICE_ACCOUNT_FIREBASE environment variable is not defined.");
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount))
})

const PORT = process.env.PORT || 8000;

app.use("/api/auth", authRouters)


app.listen(PORT, () => {
    console.log(`This server is running on port: ${PORT}`);
    
})