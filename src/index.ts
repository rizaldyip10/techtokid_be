import express, { Request, Response } from "express";
import db from "./db";
import dotenv from "dotenv"

import { authRouters } from "./routers";

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8000;

app.use("/api/auth", authRouters)


app.listen(PORT, () => {
    console.log(`This server is running on port: ${PORT}`);
    
})