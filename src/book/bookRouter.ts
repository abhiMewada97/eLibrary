import express from "express";
import { createBook, updateBook } from "./bookController"
import path from "path";
import multer from "multer";
import authenticate from "../middlewares/authenticate";

const bookRouter = express.Router();

const upload = multer({
    dest: path.resolve(__dirname, "../../public/data/uploads"),
    limits: {fileSize: 3e7}, // 30mb --> 30 * 1024 * 1024
});

bookRouter.post('/create',
    authenticate,
    upload.fields([
        {name: "coverImage", maxCount: 1},
        {name: "file", maxCount: 1},
    ]),
    createBook
);

bookRouter.patch('/updateBook/:bookId',
    authenticate,
    upload.fields([
        {name: "coverImage", maxCount: 1},
        {name: "file", maxCount: 1},
    ]),
    updateBook
);

export default bookRouter;