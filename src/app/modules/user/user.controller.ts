
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";

import httpStatus from "http-status-codes"

import { userServices } from "./user.service";
// import AppError from "../../errorHelpers/AppError";

const createUser = async (req: Request, res: Response, next: NextFunction) => {

    try {

        //  for error checking 
        // throw new Error("Mammah ! Error From Regular Error")

        // throw new AppError(httpStatus.BAD_REQUEST, "Mammah ! Error From custom AppError")

        // using the service 
        const user = await userServices.createUser(req.body)

        res.status(httpStatus.CREATED).json({
            message: "User Created Successfully",
            user
        })

    } catch (err: any) {
        // console.log(err)
        // res.status(httpStatus.BAD_REQUEST).json({
        //     message: `Something went wrong ${err?.message}`,
        //     err
        // })

        // will take to global error handler 
        next(err)
    }

}

export const userControllers = {
    createUser
}