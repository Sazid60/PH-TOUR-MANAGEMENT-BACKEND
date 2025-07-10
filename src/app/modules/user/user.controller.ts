/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextFunction, Request, Response } from "express";

import httpStatus from "http-status-codes"

import { userServices } from "./user.service";
import { catchAsync } from "../../catchAsync";
import { sendResponse } from "../../utils/sendResponse";


const createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await userServices.createUser(req.body)
    // res.status(httpStatus.CREATED).json({
    //     message: "User Created Successfully",
    //     user
    // })
    // using send response
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "User Created Successfully",
        data: user
    })
})

const getAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await userServices.getAllUsers()
    // res.status(httpStatus.OK).json({
    //     message: "Users Retrieved Successfully",
    //     users
    // })
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "User Created Successfully",
        meta: result.meta,
        data: result.data,

    })
})

export const userControllers = {
    createUser,
    getAllUsers
}