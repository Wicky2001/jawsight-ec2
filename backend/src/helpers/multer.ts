import multer from "multer";
import { Request } from "express";
import ApiError from "./ApiError.js";

export const uploadInferenceImages = multer({
  storage: multer.memoryStorage(), // Store files in memory for easy access
  limits: {
    fileSize: 100 * 1024 * 1024, // Limit file size to 100MB
  },
  fileFilter: (req: Request, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "text/csv"];
    console.log("FILE  = ", file);
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ApiError(
          400,
          "Invalid file type. Only .jpg, .jpeg, .png, and .csv are allowed.",
        ),
      );
    }
  },
});
