
import { NextFunction, Request, Response, Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { userControllers } from "./user.controller";

import { createUserZodSchema } from "./user.validation";
import AppError from "../../errorHelpers/AppError";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Role } from "./user.interface";


const router = Router()


router.get("/all-users",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // we will get the access token from frontend inside headers. foe now we will set in postman headers 
            const accessToken = req.headers.authorization;
            if (!accessToken) {
                throw new AppError(403, "No Token Received")
            }

            //  if there is token we will verify 

            const verifiedToken = jwt.verify(accessToken, "secret")

            // console.log(verifiedToken)

            // function verify(token: string, secretOrPublicKey: jwt.Secret | jwt.PublicKey, options?: jwt.VerifyOptions & {complete?: false;}): jwt.JwtPayload | string (+6 overloads)

            if ((verifiedToken as JwtPayload).role !== Role.ADMIN || Role.SUPER_ADMIN) {
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
    },
    userControllers.getAllUsers)
router.post("/register", validateRequest(createUserZodSchema), userControllers.createUser)

export const UserRoutes = router