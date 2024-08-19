import { config } from '../config/config';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from 'http-errors';


const globalErrorHandler = (err: HttpError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: err.message,
        errorStack: config.env === 'development' ? err.stack : ""       // have all info about error // don't use on production level
    });
}

export default globalErrorHandler;