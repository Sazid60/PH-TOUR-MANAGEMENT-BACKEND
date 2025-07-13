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
    const { password : pass, ...rest } = isUserExist
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