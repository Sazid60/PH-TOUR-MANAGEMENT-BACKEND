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