
import { JwtPayload } from 'jsonwebtoken';



import { NextFunction, Request, Response } from "express";
import AppError from '../errorHelpers/AppError';
import { verifyToken } from '../utils/jwt';
import { envVars } from '../config/env';

// this is receiving all the role sent (converted into an array of the sent roles) from where the middleware has been called 
export const checkAuth = (...authRoles: string[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        // we will get the access token from frontend inside headers. foe now we will set in postman headers 
        const accessToken = req.headers.authorization;
        if (!accessToken) {
            throw new AppError(403, "No Token Received")
        }

        //  if there is token we will verify 

        // const verifiedToken = jwt.verify(accessToken, "secret")

        const verifiedToken = verifyToken(accessToken, envVars.JWT_ACCESS_SECRET) as JwtPayload

        // console.log(verifiedToken)

        // function verify(token: string, secretOrPublicKey: jwt.Secret | jwt.PublicKey, options?: jwt.VerifyOptions & {complete?: false;}): jwt.JwtPayload | string (+6 overloads)

        // authRoles = ["ADMIN", "SUPER_ADMIN"]
        if (!authRoles.includes(verifiedToken.role)) {
            throw new AppError(403, "You Are Not Permitted To View This Route ")
        }

        /*
        const accessToken: string | undefined 
        token returns string(if any error occurs during verifying token) or a JwtPayload(same as any type that payload can be anything). 
        */
        next()
    } catch (error) {
        next(error)
    }
}