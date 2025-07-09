# PH-TOUR-MANAGEMENT-BACKEND-1
## 26-1 Create User interface

- User Interface Added `user.interface.ts`

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
    provider: string;
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

## 26-2 Create User model

- user.model.ts

```ts
import { model, Schema } from "mongoose";
import { IAuthProvider, IsActive, IUser, Role } from "./user.interface";

const authProviderSchema = new Schema<IAuthProvider>({
    provider: { type: String, required: true },
    providerId: { type: String, required: true }
}, {
    versionKey: false,
    _id: false
})
const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
        type: String,
        enum: Object.values(Role),
        default: Role.USER
    },
    phone: { type: String },
    picture: { type: String },
    address: { type: String },
    isDeleted: { type: Boolean, default: false },
    isActive: {
        type: String,
        enum: Object.values(IsActive),
        default: IsActive.ACTIVE
    },
    isVerified: { type: Boolean, default: false },

    auths: [authProviderSchema]

}, {
    versionKey: false,
    timestamps: true
})


export const User = model<IUser>("User", userSchema)



```

## 26-3 Create User controller and route

- user.controller.ts 

```ts 

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";

import httpStatus from "http-status-codes"
import { User } from "./user.model";

const createUser = async (req: Request, res: Response) => {

    try {

        const { name, email } = req.body

        const user = await User.create({
            name, email
        })
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
```

- user.route.ts 

```ts 
import { Router } from "express";
import { userControllers } from "./user.controller";

const router = Router()


router.post("/register", userControllers.createUser)

export const UserRoutes = router
```

- app.ts 

```ts 

import express, { Request, Response } from "express"

import cors from "cors"
import { UserRoutes } from "./app/modules/user/user.route"

const app = express()
app.use(express.json())
app.use(cors())

app.use("/api/v1/user", UserRoutes)


app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Welcome To Tour Management System"
    })
})

export default app
```

## 26-4 Create first User and organizing Routing System

- routes - > index.ts 

```ts 
import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";

export const router = Router()

const moduleRoutes = [
    {
        path: "/user",
        route: UserRoutes
    }
]

moduleRoutes.forEach((route) => {
    router.use(route.path, route.route)
})
```

- app.ts 

```ts 

import express, { Request, Response } from "express"

import cors from "cors"

import { router } from "./app/routes"

const app = express()
app.use(express.json())
app.use(cors())

app.use("/api/v1", router)


app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Welcome To Tour Management System"
    })
})

export default app
```

## 26-5 Split User Controller and Make Service Layer
- Controller controls request and responses
- We have to separate the database related works to service layer. 
- database related works should not be done inside controller. It should just handle the request and response
- So, database related works/business logics should be in service layer.   
- The Flow is like `Request -> Route -> Controller -> Service -> model -> DB -> service -> controller -> Response`

- user.service.ts 

```ts
import { IUser } from "./user.interface";
import { User } from "./user.model";

const createUser = async (payload: Partial<IUser>) => {

    const { name, email } = payload

    const user = await User.create({
        name, email
    })

    return user
}

export const userServices = {
    createUser
}

```

- user.controller.ts 


```ts 
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";

import httpStatus from "http-status-codes"

import { userServices } from "./user.service";

const createUser = async (req: Request, res: Response) => {

    try {

        // using the service 
        const user = await userServices.createUser(req.body)

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
```

## 26-6 Setting Up Global Error Handler

- middlewares - > globalErrorHandler.ts 

```ts 
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { envVars } from "../config/env";

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

    const statusCode = 500
    const message = `Something went wrong !! ${err?.message}`

    res.status(statusCode).json({
        success: false,
        message,
        err,
        stack: envVars.NODE_ENV === "development" ? err.stack : null
    })

}
```

- user.controller.ts 

```ts 


/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";

import httpStatus from "http-status-codes"

import { userServices } from "./user.service";

const createUser = async (req: Request, res: Response, next: NextFunction) => {

    try {

        // using the service 
        const user = await userServices.createUser(req.body)

        res.status(httpStatus.CREATED).json({
            message: "User Created Successfully",
            user
        })

    } catch (err: any) {
        // console.log(err)
        // res.status(httpStatus.BAD_REQUEST).json({
        //     message: `Something went wrong ${err?.message}`,
        //     err
        // })

        // will take to global error handler 
        next(err)
    }

}

export const userControllers = {
    createUser
}
```

- app.ts 

```ts 

import express, { Request, Response } from "express"

import cors from "cors"

import { router } from "./app/routes"
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler"

const app = express()
app.use(express.json())
app.use(cors())

app.use("/api/v1", router)

// using the global error handler 
app.use(globalErrorHandler)

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Welcome To Tour Management System"
    })
})

export default app
```

## 26-7 Create Custom Error Class, AppError

- we can not customize the raw js `throw new Error()`
- Lets make a custom error class now for our own preferences 

- errorHelpers -> AppError.ts 

```ts 
class AppError extends Error {
    public statusCode: number;

    constructor(statusCode: number, message: string, stack = "") {
        super(message) // this is like throw new Error("..."). this part is done inside super. 

        // now lets set the statuscode with the coming error
        this.statusCode = statusCode //this is coming from parameter and this.statusCode is from the class object

        // this stack is coming from parameter 
        if (stack) {
            this.stack = stack // this.stack coming from Error 
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export default AppError
```
- globalErrorHandler.ts 

```ts 
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

    let statusCode = 500
    let message = "Something went wrong !!"


    // for custom error 
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message
    } else if (err instanceof Error) {
        statusCode = 500;
        message = err?.message
    }

    res.status(statusCode).json({
        success: false,
        message,
        err,
        stack: envVars.NODE_ENV === "development" ? err.stack : null
    })

}
```

- For testing regular error 

```ts 

throw new Error("Mammah ! Error From Regular Error")
```
- For testing custom error 

```ts 
throw new AppError(httpStatus.BAD_REQUEST, "Mammah ! Error From custom AppError")

```