/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextFunction, Request, Response } from "express";

import httpStatus from "http-status-codes"

import { userServices } from "./user.service";
import { catchAsync } from "../../catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { verifyToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";


const createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await userServices.createUser(req.body)
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "User Created Successfully",
        data: user
    })
})
const updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id
    const token = req.headers.authorization
    const verifiedToken = verifyToken(token as string, envVars.JWT_ACCESS_SECRET) as JwtPayload
    const payload = req.body
    const user = await userServices.updateUser(userId, payload, verifiedToken)
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "User Updated Successfully",
        data: user
    })
})

const getAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await userServices.getAllUsers()
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
    getAllUsers,
    updateUser
}