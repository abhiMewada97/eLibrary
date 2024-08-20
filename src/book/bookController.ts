import { NextFunction, Response } from "express";
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


const updateBook = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { title, description, genre } = req.body;
    const bookId = req.params.bookId;

    const book = await bookModel.findOne({ _id: bookId });

    if (!book) {
        return next(createHttpError(404, "Book not found"));
    }
    // Check access
    if (book.auther.toString() !== req.userId) {
        return next(createHttpError(403, "You can not update others book."));
    }

    // check if image field is exists.

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let completeCoverImage = "";
    if (files.coverImage) {
        const filename = files.coverImage[0].filename;
        const converMimeType = files.coverImage[0].mimetype.split("/").at(-1);
        // send files to cloudinary
        const filePath = path.resolve(
            __dirname,
            "../../public/data/uploads/" + filename
        );
        completeCoverImage = filename;
        const uploadResult = await cloudinary.uploader.upload(filePath, {
            filename_override: completeCoverImage,
            folder: "book-covers",
            format: converMimeType,
        });

        completeCoverImage = uploadResult.secure_url;
        await fs.promises.unlink(filePath);
    }

    // check if file field is exists.
    let completeFileName = "";
    if (files.file) {
        const bookFilePath = path.resolve(
            __dirname,
            "../../public/data/uploads/" + files.file[0].filename
        );

        const bookFileName = files.file[0].filename;
        completeFileName = bookFileName;

        const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
            resource_type: "raw",
            filename_override: completeFileName,
            folder: "book-pdfs",
            format: "pdf",
        });

        completeFileName = uploadResultPdf.secure_url;
        await fs.promises.unlink(bookFilePath);
    }

    const updatedBook = await bookModel.findOneAndUpdate(
        {
            _id: bookId,
        },
        {
            title: title,
            description: description,
            genre: genre,
            coverImage: completeCoverImage
                ? completeCoverImage
                : book.coverImage,
            file: completeFileName ? completeFileName : book.file,
        },
        { new: true }
    );

    res.json(updatedBook);
};

const listBooks = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // const sleep = await new Promise((resolve) => setTimeout(resolve, 5000));

    try {
        // todo: add pagination.
        const book = await bookModel.find().populate("auther", "name");
        res.json(book);
    } catch (err) {
        return next(createHttpError(500, "Error while getting a book"));
    }
};

const getSingleBook = async ( req: AuthRequest, res: Response, next: NextFunction ) => {
    
    const bookId = req.params.bookId;

    try {
        const book = await bookModel.findOne({ _id: bookId }).populate("auther", "name");

        if (!book) {
            return next(createHttpError(404, "Book not found."));
        }

        return res.json(book);
    } 
    catch (err) {
        return next(createHttpError(500, "Error while getting a book"));
    }
};

const deleteBook = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const bookId = req.params.bookId;

        const book = await bookModel.findOne({ _id: bookId });

        if (!book) {
            return next(createHttpError(404, "Book not found"));
        }

        // Check access
        if (book.auther.toString() !== req.userId) {
            return next(createHttpError(403, "You can not delete others book."));
        }

        const coverFileSplits = book.coverImage.split("/");
        const coverImagePublicId = coverFileSplits.at(-2) + "/" + coverFileSplits.at(-1)?.split(".").at(-2);

        const bookFileSplits = book.file.split("/");
        const bookFilePublicId = bookFileSplits.at(-2) + "/" + bookFileSplits.at(-1);
        console.log("bookFilePublicId", bookFilePublicId);

        try {
            await cloudinary.uploader.destroy(coverImagePublicId);
        } catch (error) {
            console.error("Error deleting cover image:", error);
            return next(createHttpError(500, "Failed to delete cover image."));
        }

        try {
            await cloudinary.uploader.destroy(bookFilePublicId, {
                resource_type: "raw",
            });
        } catch (error) {
            console.error("Error deleting book file:", error);
            return next(createHttpError(500, "Failed to delete book file."));
        }

        try {
            await bookModel.deleteOne({ _id: bookId });
        } catch (error) {
            console.error("Error deleting book from database:", error);
            return next(createHttpError(500, "Failed to delete book from database."));
        }

        return res.sendStatus(204);
    } catch (error) {
        console.error("Unexpected error:", error);
        return next(createHttpError(500, "An unexpected error occurred during delete"));
    }
};



export { createBook, updateBook, listBooks, getSingleBook, deleteBook };
