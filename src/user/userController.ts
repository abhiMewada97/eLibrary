import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";

const createUser = async (req: Request, res: Response, next: NextFunction) => {

    const {name, email, password} = req.body;

    // Validation
    if(!name || !email || !password) {
        const error = createHttpError(400, "All field are required");
        return next(error);
    }
    
    // check user
    const user = await userModel.findOne({email});
    if(user) {
        const error = createHttpError(400, "User already exist with this email id");
        return next(error);
    }

    // Process

    // Response
    res.json({"message": "user create"});
}

export { createUser };