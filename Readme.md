# PH-TOUR-MANAGEMENT-BACKEND-1
- will do zod validation 
- Email Password based custom authentication 
- Role based authorization using jwt 

## 27-1 Create Zod Validation for User APIs

- We Will Use Zod While Creating a Data and Updating a Data 
- We will create zod for those whose default values are not set by backend. 


```ts 
import { NextFunction, Request, Response, Router } from "express";
import { userControllers } from "./user.controller";
import z from "zod";

const router = Router()


router.get("/all-users", userControllers.getAllUsers)
router.post("/register",
// middleware 
    async (req: Request, res: Response, next: NextFunction) => {

        const createUserZodSchema = z.object({
            name: z
                .string({ invalid_type_error: "Name must be string" })
                .min(2, { message: "Name must be at least 2 characters long." })
                .max(50, { message: "Name cannot exceed 50 characters." }),
            email: z
                .string({ invalid_type_error: "Email must be string" })
                .email({ message: "Invalid email address format." })
                .min(5, { message: "Email must be at least 5 characters long." })
                .max(100, { message: "Email cannot exceed 100 characters." }),
            password: z
                .string({ invalid_type_error: "Password must be string" })
                .min(8, { message: "Password must be at least 8 characters long." })
                .regex(/^(?=.*[A-Z])/, {
                    message: "Password must contain at least 1 uppercase letter.",
                })
                .regex(/^(?=.*[!@#$%^&*])/, {
                    message: "Password must contain at least 1 special character.",
                })
                .regex(/^(?=.*\d)/, {
                    message: "Password must contain at least 1 number.",
                }),
            phone: z
                .string({ invalid_type_error: "Phone Number must be string" })
                .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
                    message: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
                })
                .optional(),
            address: z
                .string({ invalid_type_error: "Address must be string" })
                .max(200, { message: "Address cannot exceed 200 characters." })
                .optional()
        })

        // validate using zod 

        req.body = await createUserZodSchema.parseAsync(req.body)
        console.log(req.body)
        // next()

    },

    userControllers.createUser)

export const UserRoutes = router
```

## 27-2 Implement validateRequest Middleware

- lets separate the validation 

- user.validation.ts 

```ts 
import z from "zod";

export const createUserZodSchema = z.object({
    name: z
        .string({ invalid_type_error: "Name must be string" })
        .min(2, { message: "Name must be at least 2 characters long." })
        .max(50, { message: "Name cannot exceed 50 characters." }),
    email: z
        .string({ invalid_type_error: "Email must be string" })
        .email({ message: "Invalid email address format." })
        .min(5, { message: "Email must be at least 5 characters long." })
        .max(100, { message: "Email cannot exceed 100 characters." }),
    password: z
        .string({ invalid_type_error: "Password must be string" })
        .min(8, { message: "Password must be at least 8 characters long." })
        .regex(/^(?=.*[A-Z])/, {
            message: "Password must contain at least 1 uppercase letter.",
        })
        .regex(/^(?=.*[!@#$%^&*])/, {
            message: "Password must contain at least 1 special character.",
        })
        .regex(/^(?=.*\d)/, {
            message: "Password must contain at least 1 number.",
        }),
    phone: z
        .string({ invalid_type_error: "Phone Number must be string" })
        .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
            message: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
        })
        .optional(),
    address: z
        .string({ invalid_type_error: "Address must be string" })
        .max(200, { message: "Address cannot exceed 200 characters." })
        .optional()
})
```
- lets make a higher order function for the middleware. the higher order function will be will be always coupled with middleware. it will take a function inside and will return a function from inside. when we will split a middleware function in express we will use higher order because the middleware function must return a function with request response. 


- user.route.ts 

```ts 
import { NextFunction, Request, Response, Router } from "express";
import { userControllers } from "./user.controller";
import { AnyZodObject } from "zod";
import { createUserZodSchema } from "./user.validation";


const validateRequest = (zodSchema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {

    try {
        console.log("Old Body", req.body)
        req.body = await zodSchema.parseAsync(req.body)
        console.log("New Body", req.body)
        // here data sanitization is working. 
        // Its like if we give any unwanted fields inside body it will removed. and set the properly validated data inside body and the controller will work with it. 
        next()
    } catch (error) {
        next(error)

    }
}
// this higher order function returning a function made with req and response that is required inside the route middleware. 


const router = Router()


router.get("/all-users", userControllers.getAllUsers)
router.post("/register",
    validateRequest(createUserZodSchema),
    userControllers.createUser)

export const UserRoutes = router
```

![alt text](image.png)

- Now lets separate the validate request middleware to another file 
- middlewares -> validateRequest.ts 

```ts 
import { NextFunction, Request, Response } from "express"
import { AnyZodObject } from "zod"

export const validateRequest = (zodSchema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {

    try {
        console.log("Old Body", req.body)
        req.body = await zodSchema.parseAsync(req.body)
        console.log("New Body", req.body)
        // here data sanitization is working. 
        // Its like if we give any unwanted fields inside body it will removed. and set the properly validated data inside body and the controller will work with it. 
        next()
    } catch (error) {
        next(error)

    }
}
```

- user.route.ts 

```ts 

import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { userControllers } from "./user.controller";

import { createUserZodSchema } from "./user.validation";


const router = Router()


router.get("/all-users", userControllers.getAllUsers)
router.post("/register",
    validateRequest(createUserZodSchema),
    userControllers.createUser)

export const UserRoutes = router
```

- basically the validateRequest middleware is helping us validate the data send in body before entering in contact with server. 

- Added Update User Validation schema 


```ts 
import z from "zod";
import { IsActive, Role } from "./user.interface";

export const createUserZodSchema = z.object({
    name: z
        .string({ invalid_type_error: "Name must be string" })
        .min(2, { message: "Name must be at least 2 characters long." })
        .max(50, { message: "Name cannot exceed 50 characters." }),
    email: z
        .string({ invalid_type_error: "Email must be string" })
        .email({ message: "Invalid email address format." })
        .min(5, { message: "Email must be at least 5 characters long." })
        .max(100, { message: "Email cannot exceed 100 characters." }),
    password: z
        .string({ invalid_type_error: "Password must be string" })
        .min(8, { message: "Password must be at least 8 characters long." })
        .regex(/^(?=.*[A-Z])/, {
            message: "Password must contain at least 1 uppercase letter.",
        })
        .regex(/^(?=.*[!@#$%^&*])/, {
            message: "Password must contain at least 1 special character.",
        })
        .regex(/^(?=.*\d)/, {
            message: "Password must contain at least 1 number.",
        }),
    phone: z
        .string({ invalid_type_error: "Phone Number must be string" })
        .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
            message: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
        })
        .optional(),
    address: z
        .string({ invalid_type_error: "Address must be string" })
        .max(200, { message: "Address cannot exceed 200 characters." })
        .optional()
})

export const updateUserZodSchema = z.object({
    name: z
        .string({ invalid_type_error: "Name must be string" })
        .min(2, { message: "Name must be at least 2 characters long." })
        .max(50, { message: "Name cannot exceed 50 characters." }).optional(),
    password: z
        .string({ invalid_type_error: "Password must be string" })
        .min(8, { message: "Password must be at least 8 characters long." })
        .regex(/^(?=.*[A-Z])/, {
            message: "Password must contain at least 1 uppercase letter.",
        })
        .regex(/^(?=.*[!@#$%^&*])/, {
            message: "Password must contain at least 1 special character.",
        })
        .regex(/^(?=.*\d)/, {
            message: "Password must contain at least 1 number.",
        }).optional(),
    phone: z
        .string({ invalid_type_error: "Phone Number must be string" })
        .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
            message: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
        })
        .optional(),
    role: z
        // .enum(["ADMIN", "GUIDE", "USER", "SUPER_ADMIN"])
        .enum(Object.values(Role) as [string])
        .optional(),
    isActive: z
        .enum(Object.values(IsActive) as [string])
        .optional(),
    isDeleted: z
        .boolean({ invalid_type_error: "isDeleted must be true or false" })
        .optional(),
    isVerified: z
        .boolean({ invalid_type_error: "isVerified must be true or false" })
        .optional(),
    address: z
        .string({ invalid_type_error: "Address must be string" })
        .max(200, { message: "Address cannot exceed 200 characters." })
        .optional()
})
```

## 27-3 Adding password and fix bugs for email password based User registration API

```ts 
import AppError from "../../errorHelpers/AppError";
import { IAuthProvider, IUser } from "./user.interface";
import { User } from "./user.model";
import httpStatus from 'http-status-codes';

const createUser = async (payload: Partial<IUser>) => {

    const { email, ...rest } = payload

    const isUserExist = await User.findOne({ email })

    if (isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Already Exists")
    }

    // // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    // const authProvider: IAuthProvider = {provider : "credentials", providerId : email!}


    const authProvider: IAuthProvider = { provider: "credentials", providerId: email as string }

    const user = await User.create({
        email,
        auths: [authProvider],
        ...rest
    })

    return user
}

const getAllUsers = async () => {
    const users = await User.find({})
    const totalUsers = await User.countDocuments()

    return {
        data: users,
        meta: {
            total: totalUsers
        }
    }
}

export const userServices = {
    createUser,
    getAllUsers
}
```

- update in user.interface.ts 

```ts 
import { Types } from "mongoose"

export enum Role {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    USER = "USER",
    GUIDE = "GUIDE"
}


export enum IsActive {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    BLOCKED = "BLOCKED"
}

// AUTH PROVIDER 

/**
 * EMAIL, PASSWORD
 * GOOGLE AUTHENTICATION
 */

export interface IAuthProvider {
    provider: "google" | "credentials";
    providerId: string

}
export interface IUser {
    name: string,
    email: string,
    password?: string,
    phone?: string,
    picture?: string,
    address?: string,
    isDeleted?: boolean,
    isActive?: IsActive,
    isVerified?: boolean,
    role: Role
    auths: IAuthProvider[],
    bookings?: Types.ObjectId[],
    guides?: Types.ObjectId[]


}
```