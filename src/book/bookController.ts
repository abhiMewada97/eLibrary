import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "node:fs";
import { AuthRequest } from "../middlewares/authenticate";

const createBook = async (req: AuthRequest, res: Response, next: NextFunction) => {

    const { title, genre } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    try {
        // Check if required files are present
        if (!files || !files.coverImage || !files.file) {
            throw createHttpError(400, "Cover image and book file are required");
        }

        // Process cover image upload
        const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
        const coverImageFileName = files.coverImage[0].filename;
        const coverFilePath = path.resolve(__dirname, '../../public/data/uploads', coverImageFileName);

        let uploadResult;
        try {
            uploadResult = await cloudinary.uploader.upload(coverFilePath, {
                filename_override: coverImageFileName,
                folder: "book-covers",
                format: coverImageMimeType, // Ensure format matches the file type
            });
            console.log("Book cover uploaded successfully", uploadResult);
        } catch (error) {
            throw createHttpError(500, "Error uploading cover image to Cloudinary");
        }

        // Process book file upload
        const bookFileName = files.file[0].filename;
        const bookFilePath = path.resolve(__dirname, '../../public/data/uploads', bookFileName);

        let bookFileUploadResult;
        try {
            bookFileUploadResult = await cloudinary.uploader.upload(bookFilePath, {
                resource_type: "raw",
                filename_override: bookFileName,
                folder: "book-pdfs",
                format: "pdf", // Ensure format matches the file type
            });
            console.log("Book PDF uploaded successfully", bookFileUploadResult);
        } catch (error) {
            throw createHttpError(500, "Error uploading book PDF to Cloudinary");
        }

        // Create a new book record in the database
        let newBook;
        try {

            console.log("userId ", req.userId);

            newBook = await bookModel.create({
                title,
                genre,
                auther: req.userId,
                coverImage: uploadResult.secure_url,
                file: bookFileUploadResult.secure_url,
            });
            console.log("Book record created successfully", newBook);
        } catch (error) {
            throw createHttpError(500, "Error creating book record in database");
        }

        // Delete temporary files
        try {
            await fs.promises.unlink(coverFilePath);
            await fs.promises.unlink(bookFilePath);
        } catch (error) {
            throw createHttpError(500, "Error deleting temporary files: ");
        }

        res.status(201).json({ id: newBook._id });
    } catch (error) {
        return next(error); // Passes any caught error to the error handler middleware
    }
};

export { createBook };
