# PH-TOUR-MANAGEMENT-BACKEND-3

GitHub Link: https://github.com/Apollo-Level2-Web-Dev/ph-tour-management-system-backend/tree/part-3

- In this module we will learn how to create refresh token 
- How to set the token i cookies 
- Setting up google authentication 
## 28-1 Create refresh token when login and sent it to client

#### what is refresh token?
- When a token expires this will help to refresh the token. Its like a backup token. Using the refresh token we can generate a new token again. 
- refresh token has expiration time as well and its more then the access token 

```ts 

    const refreshToken = generateToken(jwtPayload, envVars.JWT_REFRESH_SECRET, envVars.JWT_REFRESH_EXPIRES)

    // we are not sending the password in response so deleted. 
    const { password: pass, ...rest } = isUserExist
    return {
        accessToken,
        refreshToken,
        user: rest
    }
```

- auth.service.ts 

```ts 
/* eslint-disable @typescript-eslint/no-unused-vars */
import AppError from "../../errorHelpers/AppError"
import { IUser } from "../user/user.interface"
import httpStatus from 'http-status-codes';
import { User } from "../user/user.model";
import bcrypt from "bcryptjs";
import { generateToken } from "../../utils/jwt";
import { envVars } from "../../config/env";


const credentialsLogin = async (payload: Partial<IUser>) => {
    const { email, password } = payload

    const isUserExist = await User.findOne({ email })
    if (!isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "Email Does Not Exist")
    }

    const isPasswordMatch = await bcrypt.compare(password as string, isUserExist.password as string)

    if (!isPasswordMatch) {
        throw new AppError(httpStatus.BAD_REQUEST, "Password Does Not Match")
    }

    // generating access token 

    const jwtPayload = {
        userId: isUserExist._id,
        email: isUserExist.email,
        role: isUserExist.role
    }
    // const accessToken = jwt.sign(jwtPayload, "secret", { expiresIn: "1d" })
    const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)

    // function sign(payload: string | Buffer | object, secretOrPrivateKey: jwt.Secret | jwt.PrivateKey, options?: jwt.SignOptions): string (+4 overloads)

    const refreshToken = generateToken(jwtPayload, envVars.JWT_REFRESH_SECRET, envVars.JWT_REFRESH_EXPIRES)

    // we are not sending the password in response so deleted. 
    const { password : pass, ...rest } = isUserExist.toObject()
    return {
        accessToken,
        refreshToken,
        user: rest
    }
}

export const AuthServices = {
    credentialsLogin
}
```

## 28-2 Implement refresh token to get new access token
- now lets take the  access token and refresh token generation works into a utility function 

- utils -> userToken.ts
```ts 
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { IsActive, IUser } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { generateToken, verifyToken } from "./jwt";
import httpStatus from 'http-status-codes';

export const createUserToken = (user: Partial<IUser>) => {
    const jwtPayload = {
        userId: user._id,
        email: user.email,
        role: user.role
    }
    const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)

    const refreshToken = generateToken(jwtPayload, envVars.JWT_REFRESH_SECRET, envVars.JWT_REFRESH_EXPIRES)

    return {
        accessToken,
        refreshToken
    }
}

export const createNewAccessTokenWithRefreshToken = async (refreshToken: string) => {
    const verifiedRefreshToken = verifyToken(refreshToken, envVars.JWT_REFRESH_SECRET) as JwtPayload
    // we do not have to check the verified status and throw error because if not verified it automatically send error . so no need to write if else 

    const isUserExist = await User.findOne({ email: verifiedRefreshToken.email })
    if (!isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Does Not Exist")
    }

    if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, `User Is ${isUserExist.isActive}`)
    }
    if (isUserExist.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Is Deleted")
    }
    // generating access token 
    const jwtPayload = {
        userId: isUserExist._id,
        email: isUserExist.email,
        role: isUserExist.role
    }
    const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)
    return accessToken

}
```

- lets use this utility function 
- auth.service.ts 
```ts
/* eslint-disable @typescript-eslint/no-unused-vars */
import AppError from "../../errorHelpers/AppError"
import { IUser } from "../user/user.interface"
import httpStatus from 'http-status-codes';
import { User } from "../user/user.model";
import bcrypt from "bcryptjs";
import { generateToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { createUserToken } from "../../utils/userToken";


const credentialsLogin = async (payload: Partial<IUser>) => {
    const { email, password } = payload

    const isUserExist = await User.findOne({ email })
    if (!isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "Email Does Not Exist")
    }

    const isPasswordMatch = await bcrypt.compare(password as string, isUserExist.password as string)

    if (!isPasswordMatch) {
        throw new AppError(httpStatus.BAD_REQUEST, "Password Does Not Match")
    }

    // generating access token 

    // const jwtPayload = {
    //     userId: isUserExist._id,
    //     email: isUserExist.email,
    //     role: isUserExist.role
    // }
    // // const accessToken = jwt.sign(jwtPayload, "secret", { expiresIn: "1d" })
    // const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)

    // // function sign(payload: string | Buffer | object, secretOrPrivateKey: jwt.Secret | jwt.PrivateKey, options?: jwt.SignOptions): string (+4 overloads)

    // const refreshToken = generateToken(jwtPayload, envVars.JWT_REFRESH_SECRET, envVars.JWT_REFRESH_EXPIRES)

    // we are not sending the password in response so deleted. 

    const userTokens = createUserToken(isUserExist)

    const { password: pass, ...rest } = isUserExist.toObject()
    return {
        accessToken: userTokens.accessToken,
        refreshToken: userTokens.refreshToken,
        user: rest
    }
}

export const AuthServices = {
    credentialsLogin
}
```
### Now Lets generate a access token using the refresh token got while login in  
- auth.route.ts 

```ts 
import { Router } from "express";
import { AuthControllers } from "./auth.controller";

const router = Router()

router.post("/login", AuthControllers.credentialsLogin)
router.post("/refresh-token", AuthControllers.getNewAccessToken)

export const authRoutes = router
```

- auth.controller.ts 

```ts 
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express"

import { sendResponse } from "../../utils/sendResponse"
import httpStatus from 'http-status-codes';
import { AuthServices } from "./auth.service";
import { catchAsync } from "../../utils/catchAsync";

const credentialsLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const loginInfo = await AuthServices.credentialsLogin(req.body)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User Logged In Successfully",
        data: loginInfo
    })
})
const getNewAccessToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // const refreshToken = req.cookies.refreshToken
    const refreshToken = req.headers.authorization as string
    const tokenInfo = await AuthServices.getNewAccessToken(refreshToken)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User Logged In Successfully",
        data: tokenInfo
    })
})

export const AuthControllers = {
    credentialsLogin,
    getNewAccessToken
}
```

- auth.service.ts 

```ts 
/* eslint-disable @typescript-eslint/no-unused-vars */
import AppError from "../../errorHelpers/AppError"
import { IsActive, IUser } from "../user/user.interface"
import httpStatus from 'http-status-codes';
import { User } from "../user/user.model";
import bcrypt from "bcryptjs";
import { generateToken, verifyToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { createUserToken } from "../../utils/userToken";
import { JwtPayload } from "jsonwebtoken";


const credentialsLogin = async (payload: Partial<IUser>) => {
    const { email, password } = payload

    const isUserExist = await User.findOne({ email })
    if (!isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "Email Does Not Exist")
    }

    const isPasswordMatch = await bcrypt.compare(password as string, isUserExist.password as string)

    if (!isPasswordMatch) {
        throw new AppError(httpStatus.BAD_REQUEST, "Password Does Not Match")
    }

    // generating access token 

    // const jwtPayload = {
    //     userId: isUserExist._id,
    //     email: isUserExist.email,
    //     role: isUserExist.role
    // }
    // // const accessToken = jwt.sign(jwtPayload, "secret", { expiresIn: "1d" })
    // const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)

    // // function sign(payload: string | Buffer | object, secretOrPrivateKey: jwt.Secret | jwt.PrivateKey, options?: jwt.SignOptions): string (+4 overloads)

    // const refreshToken = generateToken(jwtPayload, envVars.JWT_REFRESH_SECRET, envVars.JWT_REFRESH_EXPIRES)

    // we are not sending the password in response so deleted. 

    const userTokens = createUserToken(isUserExist)

    const { password: pass, ...rest } = isUserExist.toObject()
    return {
        accessToken: userTokens.accessToken,
        refreshToken: userTokens.refreshToken,
        user: rest
    }
}


const getNewAccessToken = async (refreshToken: string) => {
    const verifiedRefreshToken = verifyToken(refreshToken, envVars.JWT_REFRESH_SECRET) as JwtPayload
    // we do not have to check the verified status and throw error because if not verified it automatically send error . so no need to write if else 

    const isUserExist = await User.findOne({ email: verifiedRefreshToken.email })
    if (!isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Does Not Exist")
    }

    if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, `User Is ${isUserExist.isActive}`)
    }
    if (isUserExist.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Is Deleted")
    }
    // generating access token 
    const jwtPayload = {
        userId: isUserExist._id,
        email: isUserExist.email,
        role: isUserExist.role
    }
    const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)
    return {
        accessToken
    }
}

export const AuthServices = {
    credentialsLogin,
    getNewAccessToken
}
```

## 28-3 Set the accessToken and refreshToken in Cookies
- keeping token in local storage is not safe. normal convention wise we will store the token in cookies 
- While Login we will set the refresh token inside the cookies. We will set the cookies in `response` while login. from the response we will set the refresh token inside cookies. 
- While refreshing the token we will get the `refresh token` from `request`. 
- While logging in, the server will generate a refresh token and send it to the client by setting it in an HTTP-only cookie via the response. Later, when the client requests a new access token, the refresh token will be retrieved from the cookies in the incoming request.

#### Lets set the refresh token inside the cookies first 


```ts 
const credentialsLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const loginInfo = await AuthServices.credentialsLogin(req.body)

    res.cookie("refreshToken", loginInfo.refreshToken,
        {
            httpOnly: true, // this is for setting the cookies in frontend 
            secure: false //because for security issue frontend normally do not allow to set cookies because backend and frontend have two different live server 
        }
    )

    // (method) Response<any, Record<string, any>, number>.cookie(name: string, val: string, options: CookieOptions): Response<any, Record<string, any>> (+2 overloads)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User Logged In Successfully",
        data: loginInfo
    })
})
```

#### Now We Need a Cookie Parser for parsing the cookies
- Install Cookie Parser 
```
npm i cookie-parser
```
- Install Cookie Parser Type Declaration

```
npm install --save @types/cookie-parser
```

- add the cookie parser in app.ts 

```ts 

import express, { Request, Response } from "express"

import cors from "cors"

import { router } from "./app/routes"
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler"
import notFound from "./app/middlewares/notFound"
import cookieParser from "cookie-parser"


const app = express()

app.use(cookieParser()) // cookie parser added
app.use(express.json())
app.use(cors())

app.use("/api/v1", router)

// using the global error handler 
app.use(globalErrorHandler)

// Using not found route 
app.use(notFound)

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Welcome To Tour Management System"
    })
})

export default app
```
- we can set the access token in cookies as well 
- now make get the refresh token auth.controller.ts 

```ts 
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express"

import { sendResponse } from "../../utils/sendResponse"
import httpStatus from 'http-status-codes';
import { AuthServices } from "./auth.service";
import { catchAsync } from "../../utils/catchAsync";
import AppError from "../../errorHelpers/AppError";

const credentialsLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const loginInfo = await AuthServices.credentialsLogin(req.body)

    res.cookie("accessToken", loginInfo.accessToken,
        {
            httpOnly: true, 
            secure: false 
        }
    )
    res.cookie("refreshToken", loginInfo.refreshToken,
        {
            httpOnly: true, // this is for setting the cookies in frontend 
            secure: false //because for security issue frontend normally do not allow to set cookies because backend and frontend have two different live server 
        }
    )

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

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User Logged In Successfully",
        data: tokenInfo
    })
})

export const AuthControllers = {
    credentialsLogin,
    getNewAccessToken
}
```

## 28-4 Create utility functions for getting accessToken and refreshToken and setting browser cookies

- lets split the generating new token functionality into utility folder function 

- auth.service.ts 

```ts
const getNewAccessToken = async (refreshToken: string) => {
    const verifiedRefreshToken = verifyToken(refreshToken, envVars.JWT_REFRESH_SECRET) as JwtPayload
    // we do not have to check the verified status and throw error because if not verified it automatically send error . so no need to write if else 

    const isUserExist = await User.findOne({ email: verifiedRefreshToken.email })
    if (!isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Does Not Exist")
    }

    if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, `User Is ${isUserExist.isActive}`)
    }
    if (isUserExist.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Is Deleted")
    }
    // generating access token 
    const jwtPayload = {
        userId: isUserExist._id,
        email: isUserExist.email,
        role: isUserExist.role
    }
    const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)
    return {
        accessToken
    }
}
```

- utils -> userToken.ts 

```ts 
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { IsActive, IUser } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { generateToken, verifyToken } from "./jwt";
import httpStatus from 'http-status-codes';

export const createUserToken = (user: Partial<IUser>) => {
    const jwtPayload = {
        userId: user._id,
        email: user.email,
        role: user.role
    }
    const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)

    const refreshToken = generateToken(jwtPayload, envVars.JWT_REFRESH_SECRET, envVars.JWT_REFRESH_EXPIRES)

    return {
        accessToken,
        refreshToken
    }
}

export const createNewAccessTokenWithRefreshToken = async (refreshToken: string) => {
    const verifiedRefreshToken = verifyToken(refreshToken, envVars.JWT_REFRESH_SECRET) as JwtPayload
    // we do not have to check the verified status and throw error because if not verified it automatically send error . so no need to write if else 

    const isUserExist = await User.findOne({ email: verifiedRefreshToken.email })
    if (!isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Does Not Exist")
    }

    if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, `User Is ${isUserExist.isActive}`)
    }
    if (isUserExist.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Is Deleted")
    }
    // generating access token 
    const jwtPayload = {
        userId: isUserExist._id,
        email: isUserExist.email,
        role: isUserExist.role
    }
    const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)
    return accessToken

}
```

- auth.service.ts 

```ts 
/* eslint-disable @typescript-eslint/no-unused-vars */
import AppError from "../../errorHelpers/AppError"
import { IsActive, IUser } from "../user/user.interface"
import httpStatus from 'http-status-codes';
import { User } from "../user/user.model";
import bcrypt from "bcryptjs";
import { generateToken, verifyToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { createNewAccessTokenWithRefreshToken, createUserToken } from "../../utils/userToken";
import { JwtPayload } from "jsonwebtoken";


const credentialsLogin = async (payload: Partial<IUser>) => {
    const { email, password } = payload

    const isUserExist = await User.findOne({ email })
    if (!isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "Email Does Not Exist")
    }

    const isPasswordMatch = await bcrypt.compare(password as string, isUserExist.password as string)

    if (!isPasswordMatch) {
        throw new AppError(httpStatus.BAD_REQUEST, "Password Does Not Match")
    }

    // generating access token 

    // const jwtPayload = {
    //     userId: isUserExist._id,
    //     email: isUserExist.email,
    //     role: isUserExist.role
    // }
    // // const accessToken = jwt.sign(jwtPayload, "secret", { expiresIn: "1d" })
    // const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)

    // // function sign(payload: string | Buffer | object, secretOrPrivateKey: jwt.Secret | jwt.PrivateKey, options?: jwt.SignOptions): string (+4 overloads)

    // const refreshToken = generateToken(jwtPayload, envVars.JWT_REFRESH_SECRET, envVars.JWT_REFRESH_EXPIRES)

    // we are not sending the password in response so deleted. 

    const userTokens = createUserToken(isUserExist)

    const { password: pass, ...rest } = isUserExist.toObject()
    return {
        accessToken: userTokens.accessToken,
        refreshToken: userTokens.refreshToken,
        user: rest
    }
}


const getNewAccessToken = async (refreshToken: string) => {
    // const verifiedRefreshToken = verifyToken(refreshToken, envVars.JWT_REFRESH_SECRET) as JwtPayload
    // // we do not have to check the verified status and throw error because if not verified it automatically send error . so no need to write if else 

    // const isUserExist = await User.findOne({ email: verifiedRefreshToken.email })
    // if (!isUserExist) {
    //     throw new AppError(httpStatus.BAD_REQUEST, "User Does Not Exist")
    // }

    // if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
    //     throw new AppError(httpStatus.BAD_REQUEST, `User Is ${isUserExist.isActive}`)
    // }
    // if (isUserExist.isDeleted) {
    //     throw new AppError(httpStatus.BAD_REQUEST, "User Is Deleted")
    // }
    // // generating access token 
    // const jwtPayload = {
    //     userId: isUserExist._id,
    //     email: isUserExist.email,
    //     role: isUserExist.role
    // }
    // const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)

    // generating access token generating works will be done by this function 
    const newAccessToken = await createNewAccessTokenWithRefreshToken(refreshToken)
    return {
        accessToken: newAccessToken
    }
}

export const AuthServices = {
    credentialsLogin,
    getNewAccessToken
}

```

#### Now Lets Separate the cookie setting functionality into a utils function 
- Previous version of auth.controller.ts 

```ts 
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express"

import { sendResponse } from "../../utils/sendResponse"
import httpStatus from 'http-status-codes';
import { AuthServices } from "./auth.service";
import { catchAsync } from "../../utils/catchAsync";
import AppError from "../../errorHelpers/AppError";

const credentialsLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const loginInfo = await AuthServices.credentialsLogin(req.body)

    res.cookie("accessToken", loginInfo.accessToken,
        {
            httpOnly: true,
            secure: false
        }
    )
    res.cookie("refreshToken", loginInfo.refreshToken,
        {
            httpOnly: true, // this is for setting the cookies in frontend 
            secure: false //because for security issue frontend normally do not allow to set cookies because backend and frontend have two different live server 
        }
    )

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
    res.cookie("refreshToken", tokenInfo.accessToken,
        {
            httpOnly: true,
            secure: false
        }
    )

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User Logged In Successfully",
        data: tokenInfo
    })
})

export const AuthControllers = {
    credentialsLogin,
    getNewAccessToken
}

```

- updated auth.controller.ts 


```ts 
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
    res.cookie("refreshToken", tokenInfo.accessToken,
        {
            httpOnly: true,
            secure: false
        }
    )

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User Logged In Successfully",
        data: tokenInfo
    })
})

export const AuthControllers = {
    credentialsLogin,
    getNewAccessToken
}

```

- utils -> setCookies.ts 

```ts 
import { Response } from "express";
interface AuthToken {
    accessToken?: string,
    refreshToken?: string

}
export const setAuthCookie = (res: Response, tokenInfo: AuthToken) => {
    if (tokenInfo.accessToken) {
        res.cookie("accessToken", tokenInfo.accessToken,
            {
                httpOnly: true,
                secure: false
            }
        )
    }
    if (tokenInfo.refreshToken) {
        res.cookie("refreshToken", tokenInfo.refreshToken,
            {
                httpOnly: true,
                secure: false
            }
        )
    }
}
```

- Final auth.controller.ts 

```ts 
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
        message: "User Logged In Successfully",
        data: tokenInfo
    })
})

export const AuthControllers = {
    credentialsLogin,
    getNewAccessToken
}
```

### How the mechanism is working?
- When a route is hit it will check if the token is expired. If the token is expired it will generate a new token using the refresh token and will set into cookies.  then will redirect to the route. 

## 28-5 Implement Logout User API

- If There is access token inside cookies we are logged in and if expires we have to generate a new one. then if logout route hit we will logout by clearing the refresh token and access token from cookies. 

- auth.route.ts 
```ts 
import { Router } from "express";
import { AuthControllers } from "./auth.controller";

const router = Router()

router.post("/login", AuthControllers.credentialsLogin)
router.post("/refresh-token", AuthControllers.getNewAccessToken)
router.post("/logout", AuthControllers.logout)

export const authRoutes = router
```

- auth.controller.ts 

```ts 
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
```

## 28-6 Implement Reset / Change Password
- For reset password user must be logged in
- If User is not logged in and want to change the password , we have to implement forget password facunctionality 

#### For Reset Password 
- First of all we have to check if the user is authentic. 
- As we are using checkAuth() in route we our token will be checked and decoded token information will be set to the req.user. (token verification is done here as well her )

- lets doo user verification works done in checkAuth(). so that further we do not have to check every time that exist or not 

- checkAuth.ts 
```ts 

import { JwtPayload } from 'jsonwebtoken';



import { NextFunction, Request, Response } from "express";
import AppError from '../errorHelpers/AppError';
import { verifyToken } from '../utils/jwt';
import { envVars } from '../config/env';
import httpStatus from 'http-status-codes';
import { IsActive } from '../modules/user/user.interface';
import { User } from '../modules/user/user.model';

// this is receiving all the role sent (converted into an array of the sent roles) from where the middleware has been called 
export const checkAuth = (...authRoles: string[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        // we will get the access token from frontend inside headers. for now we will set in postman headers 
        const accessToken = req.headers.authorization;
        if (!accessToken) {
            throw new AppError(403, "No Token Received")
        }

        //  if there is token we will verify 

        // const verifiedToken = jwt.verify(accessToken, "secret")

        const verifiedToken = verifyToken(accessToken, envVars.JWT_ACCESS_SECRET) as JwtPayload

        // console.log(verifiedToken)

        // function verify(token: string, secretOrPublicKey: jwt.Secret | jwt.PublicKey, options?: jwt.VerifyOptions & {complete?: false;}): jwt.JwtPayload | string (+6 overloads)
        const isUserExist = await User.findOne({ email: verifiedToken.email })
        if (!isUserExist) {
            throw new AppError(httpStatus.BAD_REQUEST, "User Does Not Exist")
        }

        if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
            throw new AppError(httpStatus.BAD_REQUEST, `User Is ${isUserExist.isActive}`)
        }
        if (isUserExist.isDeleted) {
            throw new AppError(httpStatus.BAD_REQUEST, "User Is Deleted")
        }
        // authRoles = ["ADMIN", "SUPER_ADMIN"]
        if (!authRoles.includes(verifiedToken.role)) {
            throw new AppError(403, "You Are Not Permitted To View This Route ")
        }

        /*
        const accessToken: string | undefined 
        token returns string(if any error occurs during verifying token) or a JwtPayload(same as any type that payload can be anything). 
        */

        // we will make the verified token to go outside

        // req has its own method like we can get req.bdy, req.params. req.query, req.headers. but we will not get req.user for this we need custom package. of user. 
        req.user = verifiedToken

        next()
    } catch (error) {
        next(error)
    }
}
```
- now we can work in peace in service layer. 

- auth.route.ts 

```ts 
import { Router } from "express";
import { AuthControllers } from "./auth.controller";
import { checkAuth } from '../../middlewares/checkAuth';
import { Role } from "../user/user.interface";

const router = Router()

router.post("/login", AuthControllers.credentialsLogin)
router.post("/refresh-token", AuthControllers.getNewAccessToken)
router.post("/logout", AuthControllers.logout)
router.post("/reset-password", checkAuth(...Object.values(Role)), AuthControllers.resetPassword)

export const authRoutes = router
```

- auth.controller.ts 

```ts 
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express"

import { sendResponse } from "../../utils/sendResponse"
import httpStatus from 'http-status-codes';
import { AuthServices } from "./auth.service";
import { catchAsync } from "../../utils/catchAsync";
import AppError from "../../errorHelpers/AppError";
import { setAuthCookie } from "../../utils/setCookie";
import bcrypt from 'bcryptjs';


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

    // (method) Response<any, Record<string, any>, number>.clearCookie(name: string, options?: CookieOptions): Response<any, Record<string, any>>

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User Logged Out Successfully",
        data: null
    })

})
const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const newPassword = req.body.newPassword
    const oldPassword = req.body.oldPassword
    const decodedToken = req.user

    await AuthServices.resetPassword(oldPassword, newPassword, decodedToken)


    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "password Changed Successfully",
        data: null
    })

})


export const AuthControllers = {
    credentialsLogin,
    getNewAccessToken,
    logout,
    resetPassword
}
```

- auth.service.ts 

```ts 
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
import AppError from '../../errorHelpers/AppError';
import { IsActive, IUser } from "../user/user.interface"
import httpStatus from 'http-status-codes';
import { User } from "../user/user.model";
import bcrypt from "bcryptjs";
import { generateToken, verifyToken } from "../../utils/jwt";
import { envVars } from '../../config/env';
import { createNewAccessTokenWithRefreshToken, createUserToken } from "../../utils/userToken";
import { JwtPayload } from "jsonwebtoken";


const credentialsLogin = async (payload: Partial<IUser>) => {
    const { email, password } = payload

    const isUserExist = await User.findOne({ email })
    if (!isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "Email Does Not Exist")
    }

    const isPasswordMatch = await bcrypt.compare(password as string, isUserExist.password as string)

    if (!isPasswordMatch) {
        throw new AppError(httpStatus.BAD_REQUEST, "Password Does Not Match")
    }

    // generating access token 

    // const jwtPayload = {
    //     userId: isUserExist._id,
    //     email: isUserExist.email,
    //     role: isUserExist.role
    // }
    // // const accessToken = jwt.sign(jwtPayload, "secret", { expiresIn: "1d" })
    // const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)

    // // function sign(payload: string | Buffer | object, secretOrPrivateKey: jwt.Secret | jwt.PrivateKey, options?: jwt.SignOptions): string (+4 overloads)

    // const refreshToken = generateToken(jwtPayload, envVars.JWT_REFRESH_SECRET, envVars.JWT_REFRESH_EXPIRES)

    // we are not sending the password in response so deleted. 

    const userTokens = createUserToken(isUserExist)

    const { password: pass, ...rest } = isUserExist.toObject()
    return {
        accessToken: userTokens.accessToken,
        refreshToken: userTokens.refreshToken,
        user: rest
    }
}


const getNewAccessToken = async (refreshToken: string) => {
    // const verifiedRefreshToken = verifyToken(refreshToken, envVars.JWT_REFRESH_SECRET) as JwtPayload
    // // we do not have to check the verified status and throw error because if not verified it automatically send error . so no need to write if else 

    // const isUserExist = await User.findOne({ email: verifiedRefreshToken.email })
    // if (!isUserExist) {
    //     throw new AppError(httpStatus.BAD_REQUEST, "User Does Not Exist")
    // }

    // if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
    //     throw new AppError(httpStatus.BAD_REQUEST, `User Is ${isUserExist.isActive}`)
    // }
    // if (isUserExist.isDeleted) {
    //     throw new AppError(httpStatus.BAD_REQUEST, "User Is Deleted")
    // }
    // // generating access token 
    // const jwtPayload = {
    //     userId: isUserExist._id,
    //     email: isUserExist.email,
    //     role: isUserExist.role
    // }
    // const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)

    // generating access token generating works will be done by this function 
    const newAccessToken = await createNewAccessTokenWithRefreshToken(refreshToken)
    return {
        accessToken: newAccessToken
    }
}


const resetPassword = async (oldPassword: string, newPassword: string, decodedToken: JwtPayload) => {

    const user = await User.findById(decodedToken.userId)

    const isOldPasswordMatch = await bcrypt.compare(oldPassword, user!.password as string)
    if (!isOldPasswordMatch) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Old Password does not match");
    }

    user!.password = await bcrypt.hash(newPassword, Number(envVars.BCRYPT_SALT_ROUND))

    user!.save();

}
export const AuthServices = {
    credentialsLogin,
    getNewAccessToken,
    resetPassword
}
```


## 28-7 Third Party Authentication Packages, Passport JS and Setting Up Google Cloud Console

- We will use passport.js for social authentications [passport js](https://www.passportjs.org/)
- Passport is authentication middleware for Node.js. Extremely flexible and modular, Passport can be unobtrusively dropped in to any Express-based web application. A comprehensive set of strategies support authentication using a username and password, Facebook, Twitter, and more.
- It Will works like middleware. 
- we will use `Oauth20` for google login [oAuth20](https://www.passportjs.org/packages/passport-google-oauth20/)
- so far we have done custom authentication system. we can use passport js for making the custom authentication. [passport-local](https://www.passportjs.org/packages/passport-local/)

#### Setup passport.js 
- install passport 

```
npm i passport 
```
- install passport

``` 
npm install passport-google-oauth20
```
```
npm install passport-local
```
- install the dependencies 

```
npm install -D @types/passport
```
```
npm install -D @types/passport-local
```
```
npm install -D @types/passport-google-oauth20
```

- go to google cloud -> console -> side bar -> api services -> create a project then go to oAuth concent screen -> create- oAuth Client

[Google Cloud](https://cloud.google.com/)

- SET THE CLIENT_ID AND CLIENT_SECRET to .env  
- install express session 

```
npm i express-session 
```
- install dependencies 

```
npm i --save-dev @types/express-session
```

## 28-8 Configuring Passport JS for Backend and Google Authentication Configuration

- app.ts 
```ts 
app.use(expressSession({
    secret: "Your Secret",
    resave : false,
    saveUninitialized: false
}))
app.use(passport.initialize()) //for passport js 
app.use(passport.session())
```
```ts 

import express, { Request, Response } from "express"

import cors from "cors"

import { router } from "./app/routes"
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler"
import notFound from "./app/middlewares/notFound"
import cookieParser from "cookie-parser"
import passport from "passport"
import expressSession from "express-session"

const app = express()
app.use(expressSession({
    secret: "Your Secret",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize()) //for passport js 
app.use(passport.session())
app.use(cookieParser()) // cookie parser added
app.use(express.json())
app.use(cors())

app.use("/api/v1", router)

// using the global error handler 
app.use(globalErrorHandler)

// Using not found route 
app.use(notFound)

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Welcome To Tour Management System"
    })
})

export default app
```

- update the env.ts 

```ts 
import dotenv from "dotenv";

dotenv.config()

interface EnvConfig {
    PORT: string,
    DB_URL: string,
    NODE_ENV: "development" | "production"
    BCRYPT_SALT_ROUND: string
    JWT_ACCESS_SECRET: string
    JWT_ACCESS_EXPIRES: string
    JWT_REFRESH_SECRET: string
    JWT_REFRESH_EXPIRES: string
    SUPER_ADMIN_EMAIL: string
    SUPER_ADMIN_PASSWORD: string
    GOOGLE_CLIENT_SECRET: string
    GOOGLE_CLIENT_ID: string
    GOOGLE_CALLBACK_URL: string
    EXPRESS_SESSION_SECRET: string
    FRONTEND_URL: string

}

const loadEnvVariables = (): EnvConfig => {
    const requiredEnvVariables: string[] = ["PORT", "DB_URL", "NODE_ENV", "BCRYPT_SALT_ROUND", "JWT_ACCESS_EXPIRES", "JWT_ACCESS_SECRET", "SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD", "JWT_REFRESH_SECRET", "JWT_REFRESH_EXPIRES", "GOOGLE_CLIENT_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CALLBACK_URL", "EXPRESS_SESSION_SECRET", "FRONTEND_URL"];

    requiredEnvVariables.forEach(key => {
        if (!process.env[key]) {
            throw new Error(`Missing require environment variabl ${key}`)
        }
    })

    return {
        PORT: process.env.PORT as string,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        DB_URL: process.env.DB_URL!,
        NODE_ENV: process.env.NODE_ENV as "development" | "production",
        BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND as string,
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
        JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES as string,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
        JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES as string,
        SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL as string,
        SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD as string,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
        GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,
        EXPRESS_SESSION_SECRET: process.env.EXPRESS_SESSION_SECRET as string,
        FRONTEND_URL: process.env.FRONTEND_URL as string

    }
}

export const envVars = loadEnvVariables()
```

- config -> passport.ts 

```ts 
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { envVars } from "./env";

passport.use(
    new GoogleStrategy(
        {
            clientID: envVars.GOOGLE_CLIENT_ID,
            clientSecret: envVars.GOOGLE_CLIENT_SECRET,
            callbackURL: envVars.GOOGLE_CALLBACK_URL
        }, async() => {}
    ))
```