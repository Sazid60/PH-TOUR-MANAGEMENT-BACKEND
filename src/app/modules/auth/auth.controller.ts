/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express"

import { sendResponse } from "../../utils/sendResponse"
import httpStatus from 'http-status-codes';
import { AuthServices } from "./auth.service";
import { catchAsync } from "../../utils/catchAsync";
import AppError from "../../errorHelpers/AppError";
import { setAuthCookie } from "../../utils/setCookie";
import { JwtPayload } from "jsonwebtoken";
import { createUserToken } from "../../utils/userToken";
import { envVars } from "../../config/env";
import passport from "passport";


const credentialsLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // const loginInfo = await AuthServices.credentialsLogin(req.body)

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
    // setAuthCookie(res, loginInfo)

    // // (method) Response<any, Record<string, any>, number>.cookie(name: string, val: string, options: CookieOptions): Response<any, Record<string, any>> (+2 overloads)

    // sendResponse(res, {
    //     success: true,
    //     statusCode: httpStatus.OK,
    //     message: "User Logged In Successfully",
    //     data: loginInfo
    // })

    // all works including the response sending will be done by passport controller 


    // (method) Authenticator<Handler, any, any, AuthenticateOptions>.authenticate(strategy: string | string[] | passport.Strategy, callback?: passport.AuthenticateCallback | ((...args: any[]) => any) | undefined): any (+2 overloads)

    passport.authenticate("local", async (err: any, user: any, info: any) => {
        // where we are getting  (err: any, user: any, info: any) in the function? 
        // remember ? we have used to send response done(err, user, info)? this the reason why we are getting here. 
        if (err) {
            // return new AppError(401, err) we can not use this as well
            // here we can not directly call the throw new AppError(403,err) because we are inside passport js service 
            // things we can do here for throwing error 
            /*
            * return next(err) 

            here we were not suppose to get return next(). still we are getting because we have manually triggered the function at the end (req, res, next). but we can not just write next(err)

            * we can not use not use done() here — because you're already in the final callback of passport.authenticate, where done() has already been called internally by Passport.

            */

            // return next(err)
            // or

            return next(new AppError(401, err))
        }

        if (!user) {
            // console.log("from !user");
            // return new AppError(401, info.message)
            return next(new AppError(401, info.message))
        }

        const userTokens = await createUserToken(user)

        // delete user.toObject().password

        const { password: pass, ...rest } = user.toObject()


        setAuthCookie(res, userTokens)

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "User Logged In Successfully",
            data: {
                accessToken: userTokens.accessToken,
                refreshToken: userTokens.refreshToken,
                user: rest
            }
        })
    })(req, res, next) // express just call the upper function and it do call function inside the function. so if we use passport.authenticate() in other function we need to manually trigger. 
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

    // (method) Response<any, Record<string, any>, number>.clearCookie(name: string, options?: CookieOptions): Response<any, Record<string, any>>

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User Logged Out Successfully",
        data: null
    })

})
const changePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const newPassword = req.body.newPassword
    const oldPassword = req.body.oldPassword
    const decodedToken = req.user

    await AuthServices.changePassword(oldPassword, newPassword, decodedToken as JwtPayload)


    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "password Changed Successfully",
        data: null
    })

})

const setPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const decodedToken = req.user as JwtPayload
    const { password } = req.body

    await AuthServices.setPassword(decodedToken.userId, password)


    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "password set Successfully",
        data: null
    })

})
const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body

    console.log(email)

    await AuthServices.forgotPassword(email)


    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Email Sent Successfully",
        data: null
    })

})

const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // const { newPassword, id } = req.body
    const decodedToken = req.user

    await AuthServices.resetPassword(req.body, decodedToken as JwtPayload)


    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "password reset Successfully",
        data: null
    })

})
const googleCallbackController = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // wer are getting this because of  return done(null, user) // set by the passport.js 
    const user = req.user;

    let redirectTo = req.query.state ? req.query.state as string : ""

    if (redirectTo.startsWith("/")) {
        redirectTo = redirectTo.slice(1) // /booking => booking , => "/" => ""
    }

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User Not Found")
    }

    const tokenInfo = createUserToken(user)

    setAuthCookie(res, tokenInfo)

    // sendResponse(res, {
    //     success: true,
    //     statusCode: httpStatus.OK,
    //     message: "password Changed Successfully",
    //     data: null
    // })

    // after successful login it will redirect the home page to this link
    res.redirect(`${envVars.FRONTEND_URL}/${redirectTo}`)

})


export const AuthControllers = {
    credentialsLogin,
    getNewAccessToken,
    logout,
    changePassword,
    resetPassword,
    googleCallbackController,
    setPassword,
    forgotPassword
}
