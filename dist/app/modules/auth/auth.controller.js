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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthControllers = void 0;
const sendResponse_1 = require("../../utils/sendResponse");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const auth_service_1 = require("./auth.service");
const catchAsync_1 = require("../../utils/catchAsync");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const setCookie_1 = require("../../utils/setCookie");
const userToken_1 = require("../../utils/userToken");
const env_1 = require("../../config/env");
const passport_1 = __importDefault(require("passport"));
const credentialsLogin = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
    passport_1.default.authenticate("local", (err, user, info) => __awaiter(void 0, void 0, void 0, function* () {
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
            return next(new AppError_1.default(401, err));
        }
        if (!user) {
            // console.log("from !user");
            // return new AppError(401, info.message)
            return next(new AppError_1.default(401, info.message));
        }
        const userTokens = yield (0, userToken_1.createUserToken)(user);
        // delete user.toObject().password
        const _a = user.toObject(), { password: pass } = _a, rest = __rest(_a, ["password"]);
        (0, setCookie_1.setAuthCookie)(res, userTokens);
        (0, sendResponse_1.sendResponse)(res, {
            success: true,
            statusCode: http_status_codes_1.default.OK,
            message: "User Logged In Successfully",
            data: {
                accessToken: userTokens.accessToken,
                refreshToken: userTokens.refreshToken,
                user: rest
            }
        });
    }))(req, res, next); // express just call the upper function and it do call function inside the function. so if we use passport.authenticate() in other function we need to manually trigger. 
}));
const getNewAccessToken = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.cookies.refreshToken;
    // const refreshToken = req.headers.authorization as string // only used for test purpose 
    if (!refreshToken) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "No Access Token Received");
    }
    const tokenInfo = yield auth_service_1.AuthServices.getNewAccessToken(refreshToken);
    // this will set the newly generated access token (generated using refresh token) to the cookies
    (0, setCookie_1.setAuthCookie)(res, tokenInfo);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "New Access Token Generated Successfully",
        data: tokenInfo
    });
}));
const logout = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    });
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    });
    // (method) Response<any, Record<string, any>, number>.clearCookie(name: string, options?: CookieOptions): Response<any, Record<string, any>>
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "User Logged Out Successfully",
        data: null
    });
}));
const changePassword = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const newPassword = req.body.newPassword;
    const oldPassword = req.body.oldPassword;
    const decodedToken = req.user;
    yield auth_service_1.AuthServices.changePassword(oldPassword, newPassword, decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "password Changed Successfully",
        data: null
    });
}));
const setPassword = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const { password } = req.body;
    yield auth_service_1.AuthServices.setPassword(decodedToken.userId, password);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "password set Successfully",
        data: null
    });
}));
const forgotPassword = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    console.log(email);
    yield auth_service_1.AuthServices.forgotPassword(email);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Email Sent Successfully",
        data: null
    });
}));
const resetPassword = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // const { newPassword, id } = req.body
    const decodedToken = req.user;
    yield auth_service_1.AuthServices.resetPassword(req.body, decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "password reset Successfully",
        data: null
    });
}));
const googleCallbackController = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // wer are getting this because of  return done(null, user) // set by the passport.js 
    const user = req.user;
    let redirectTo = req.query.state ? req.query.state : "";
    if (redirectTo.startsWith("/")) {
        redirectTo = redirectTo.slice(1); // /booking => booking , => "/" => ""
    }
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User Not Found");
    }
    const tokenInfo = (0, userToken_1.createUserToken)(user);
    (0, setCookie_1.setAuthCookie)(res, tokenInfo);
    // sendResponse(res, {
    //     success: true,
    //     statusCode: httpStatus.OK,
    //     message: "password Changed Successfully",
    //     data: null
    // })
    // after successful login it will redirect the home page to this link
    res.redirect(`${env_1.envVars.FRONTEND_URL}/${redirectTo}`);
}));
exports.AuthControllers = {
    credentialsLogin,
    getNewAccessToken,
    logout,
    changePassword,
    resetPassword,
    googleCallbackController,
    setPassword,
    forgotPassword
};
