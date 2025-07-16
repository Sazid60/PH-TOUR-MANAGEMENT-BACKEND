/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

    let statusCode = 500
    let message = "Something went wrong !!"
    const errorSources: any = []


    if (err.code === 11000) {
        // console.log(err)
        statusCode = 400;
        const matchedArray = err.message.match(/"([^"]*)"/)
        message = `${matchedArray[1]} already Exist`
    } else if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid Mongodb Object Id ! Please Provide Valid Id ! "
    } else if (err.name === "ValidationError") {
        statusCode = 400;
        const errors = Object.values(err.errors)
        // console.log(errors)

        errors.forEach((errorObject: any) => errorSources.push({
            path: errorObject.path,
            message: errorObject.message
        }))
        message = "Validation Error"
    }
    else if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message
    } else if (err instanceof Error) {
        statusCode = 500;
        message = err?.message
    }

    res.status(statusCode).json({
        success: false,
        message,
        errorSources,
        err,
        stack: envVars.NODE_ENV === "development" ? err.stack : null
    })

}