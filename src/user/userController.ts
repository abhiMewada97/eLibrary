import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userType";

const createUser = async (req: Request, res: Response, next: NextFunction) => {

    const {name, email, password} = req.body;

    // Validation
    if(!name || !email || !password) {
        const error = createHttpError(400, "All field are required");
        return next(error);
    }
    
    // check user
    try {
        const user = await userModel.findOne({email});
        if(user) {
            const error = createHttpError(400, "User already exist with this email id");
            return next(error);
        }
    } catch (error) {
        return next(createHttpError(500, "Error while getting user"));
    }

    // Password --> hash
    let newUser: User;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
    
        newUser = await userModel.create({
            name,
            email,
            password: hashedPassword,
        });
    } catch (error) {
        return next(createHttpError(500, "Error while creating user"));
    }

    try {
        // Token generation --> JWT
        const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
            expiresIn: '7d',
            algorithm: 'HS256' // by default
        });
    
        // Response
        res.json({accessToken: token});
    } catch (error) {
        return next(createHttpError(500, "Error while signing user"));
    }
};

export { createUser };