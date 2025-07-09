/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";

import httpStatus from "http-status-codes"

import { userServices } from "./user.service";

const createUser = async (req: Request, res: Response) => {

    try {

        // using the service 
        const user = userServices.createUser(req.body)

        res.status(httpStatus.CREATED).json({
            message: "User Created Successfully",
            user
        })

    } catch (err: any) {
        console.log(err)
        res.status(httpStatus.BAD_REQUEST).json({
            message: `Something went wrong ${err?.message}`,
            err
        })
    }

}

export const userControllers = {
    createUser
}