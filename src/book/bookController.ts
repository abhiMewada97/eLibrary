import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "path";
import createHttpError from "http-errors";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
        const fileName = files.coverImage[0].filename;
        const filePath = path.resolve(__dirname, '../../public/data/uploads', fileName);

        // Upload on Cloudinary
        const uploadResult = await cloudinary.uploader.upload(filePath, {
            filename_override: fileName,
            folder: "book-covers", 
            format: coverImageMimeType, // Ensure format matches the file type
        });

        console.log("Book cover uploaded successfully ",uploadResult);

    } catch (error) {
        return next(createHttpError(500, "Error while uploading cover image" ));
    }

    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (!files || !files.coverImage || files.coverImage.length === 0) {
            return res.status(400).json({ message: "PDFfile not provided" });
        }

        // const coverImageMimeType = bookFileName.coverImage[0].mimetype.split("/").at(-1);
        const bookFileName = files.file[0].filename;
        const bookFilePath = path.resolve(__dirname, '../../public/data/uploads', bookFileName);

        // Upload on Cloudinary 
        const bookFileUploadResult = await cloudinary.uploader.upload(bookFilePath, {
            resource_type: "raw",
            filename_override: bookFileName,
            folder: "book-pdfs", 
            format: "pdf", // Ensure format matches the file type
        });

        console.log("Book pdf uploaded successfully ",bookFileUploadResult);

    } catch (error) {
        return next(createHttpError(500, "Error while uploading pdf" ));

    }
    res.json({});
};

export { createBook };
