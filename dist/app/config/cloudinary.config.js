"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinaryUpload = exports.uploadBufferToCloudinary = exports.deleteImageFromCloudinary = void 0;
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
const cloudinary_1 = require("cloudinary");
const env_1 = require("./env");
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const stream_1 = __importDefault(require("stream"));
cloudinary_1.v2.config({
    cloud_name: env_1.envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
    api_key: env_1.envVars.CLOUDINARY.CLOUDINARY_API_KEY,
    api_secret: env_1.envVars.CLOUDINARY.CLOUDINARY_API_SECRET
});
// cloudinary.v2.uploader.upload(file, options).then(callback);
// this is the system of cloudinary but we will do it using a package.
// this package will take the file and will do the work and will return the url inside the req.file object 
const deleteImageFromCloudinary = (url) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|gif|webp)$/i;
        const match = url.match(regex);
        console.log({ match });
        if (match && match[1]) {
            const public_id = match[1];
            yield cloudinary_1.v2.uploader.destroy(public_id);
            console.log(`File ${public_id} is deleted from cloudinary`);
        }
    }
    catch (error) {
        throw new AppError_1.default(401, "Cloudinary image deletion failed", error.message);
    }
});
exports.deleteImageFromCloudinary = deleteImageFromCloudinary;
// This function converts your Buffer into a stream and uploads it.
const uploadBufferToCloudinary = (buffer, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    // It returns a Promise that will eventually resolve to "Hello".
    try {
        // cloudinary upload function doesn’t return a Promise, so you must manually wrap it
        return new Promise((resolve, reject) => {
            const public_id = `pdf/${fileName}-${Date.now()}`;
            // converting the buffer in stream 
            const bufferStream = new stream_1.default.PassThrough();
            // PassThrough is a special Node.js stream that lets you push a Buffer and treat it as a readable stream.
            bufferStream.end(buffer);
            // Writes the last chunk of data (buffer) to the stream.
            // template cloudinary.uploader.upload_stream(options, callback)
            cloudinary_1.v2.uploader.upload_stream({
                resource_type: "auto",
                public_id: public_id,
                folder: "pdf"
            }, (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            }).end(buffer);
            // You immediately .end(buffer) → This writes the entire buffer to that stream.
            // .end(buffer) Writes your entire buffer to the Cloudinary stream.
            // Closes the stream so Cloudinary can finish uploading.
        });
    }
    catch (error) {
        console.log(error);
        throw new AppError_1.default(401, `Error uploading file ${error.message}`);
    }
});
exports.uploadBufferToCloudinary = uploadBufferToCloudinary;
exports.cloudinaryUpload = cloudinary_1.v2;
