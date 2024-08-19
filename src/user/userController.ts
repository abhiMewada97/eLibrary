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
    } catch {
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
    } catch {
        return next(createHttpError(500, "Error while creating user"));
    }

    try {
        // Token generation --> JWT
        const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
            expiresIn: '7d',
            algorithm: 'HS256' // by default
        });
    
        // Response
        res.status(201).json({accessToken: token});
    } catch {
        return next(createHttpError(500, "Error while signing user"));
    }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        return next(createHttpError(400, "All fields are required"));
    }

    // Find user by email
    let user;
    try {
        user = await userModel.findOne({ email });
        if (!user) {
            return next(createHttpError(404, "User not found"));
        }
    } catch {
        return next(createHttpError(500, "Error while fetching user"));
    }

    // Compare passwords
    let isMatch;
    try {
        isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return next(createHttpError(400, "Username or password incorrect!"));
        }
    } catch {
        return next(createHttpError(500, "Error while comparing passwords"));
    }

    // Generate JWT token
    try {
        const token = sign({ sub: user._id }, config.jwtSecret as string, {
            expiresIn: '7d',
            algorithm: 'HS256',
        });

        // Respond with token
        res.status(201).json({ accessToken: token });
    } catch {
        return next(createHttpError(500, "Error while generating token"));
    }
};

export { createUser, loginUser };