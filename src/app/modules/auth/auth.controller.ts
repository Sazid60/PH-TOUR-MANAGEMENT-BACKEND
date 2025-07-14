/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express"

import { sendResponse } from "../../utils/sendResponse"
import httpStatus from 'http-status-codes';
import { AuthServices } from "./auth.service";
import { catchAsync } from "../../utils/catchAsync";
import AppError from "../../errorHelpers/AppError";
import { setAuthCookie } from "../../utils/setCookie";


const credentialsLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const loginInfo = await AuthServices.credentialsLogin(req.body)

    // res.cookie("accessToken", loginInfo.accessToken,
    //     {
    //         httpOnly: true,
    //         secure: false
    //     }
    // )
    // res.cookie("refreshToken", loginInfo.refreshToken,
    //     {
    //         httpOnly: true, // this is for setting the cookies in frontend 
    //         secure: false //because for security issue frontend normally do not allow to set cookies because backend and frontend have two different live server 
    //     }
    // )

    // both access token and refresh token works will be done by this function 
    setAuthCookie(res, loginInfo)

    // (method) Response<any, Record<string, any>, number>.cookie(name: string, val: string, options: CookieOptions): Response<any, Record<string, any>> (+2 overloads)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User Logged In Successfully",
        data: loginInfo
    })
})
const getNewAccessToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken
    // const refreshToken = req.headers.authorization as string // only used for test purpose 
    if (!refreshToken) {
        throw new AppError(httpStatus.BAD_REQUEST, "No Access Token Received")
    }
    const tokenInfo = await AuthServices.getNewAccessToken(refreshToken)
    // this will set the newly generated access token (generated using refresh token) to the cookies

    setAuthCookie(res, tokenInfo)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "New Access Token Generated Successfully",
        data: tokenInfo
    })
})
const logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie("accessToken",
        {
            httpOnly: true,
            secure: false,
            sameSite: "lax"
        }
    )
    res.clearCookie("refreshToken",
        {
            httpOnly: true,
            secure: false,
            sameSite: "lax"
        }
    )

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User Logged Out Successfully",
        data: null
    })

})
// (method) Response<any, Record<string, any>, number>.clearCookie(name: string, options?: CookieOptions): Response<any, Record<string, any>>



export const AuthControllers = {
    credentialsLogin,
    getNewAccessToken,
    logout
}