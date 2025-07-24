# PH-TOUR-MANAGEMENT-BACKEND-7

GitHub Link: https://github.com/Apollo-Level2-Web-Dev/ph-tour-management-system-backend/tree/part-7

## 32-1 Introduction to Multer and Cloudinary, Opening Cloudinary account and get secrets

#### What We Will Learn Here?

- file upload 
- email system 
- aggregation 

#### We will use `Multer` for file upload 

[MULTER](https://www.npmjs.com/package/multer)

- Multer is a node.js middleware for handling multipart/form-data, which is primarily used for uploading files. It is written on top of busboy for maximum efficiency.
- All the data we send converted to json file but for files its not converted to json format. 
- For files are consider4ed as form data. 
- Multer will not process any form which is not multipart (multipart/form-data).
- Install Multer 
```
npm i multer
```

```
npm install --save @types/multer
```

- we have to keep the file in a cloud platform and we will keep the url in mongodb 
- for keeping the file  we will use `cloudinary`

[cloudinary](https://console.cloudinary.com/app/c-30c565845165644fc838f40db771b1/image/getting-started)


- install cloudinary 

```ts 
npm i cloudinary
```

#### Lets see how multer works
- when data will be coming from frontend the multer will convert into two parts 
- one part is body 
- when we will upload file, multer will convert the file into a body file named object and this will be in our request like if we do `req.file` we will get the file
- Multer adds a body object and a file or files object to the request object. The body object contains the values of the text fields of the form, the file or files object contains the files uploaded via the form.
- Frontend -> Form Data with Image File -> Multer -> Form data -> Req (Body + File)
- how multer is working? 
- when we upload a file it will take the image and store in a folder (temporary) and then from the folder multer will give us the file in a `req.file`
- Frontend -> Form Data with Image File -> Multer -> Form data -> Req (Body + File)
- Amader folder -> image -> form data -> File -> Multer -> Amader project / pc te Nijer ekta folder(temporary) -> Req.file
- after getting the file in req.file we will tell cloudinary to upload the file and give me a url that will be stored in mongodb. 
- req.file -> cloudinary(req.file) -> url -> mongoose -> mongodb

## 32-2 Configure Multer and Cloudinary For Image Upload
- Cloudinary upload workflow 
```
cloudinary.v2.uploader.upload(file, options).then(callback);
```
- this is the system of cloudinary but we will do it using a package.
- this package will take the file and will do the work and will return the url inside the req.file object 

- we will use `multer-storage-cloudinary` cloudinary package 

```
npm i multer-storage-cloudinary
```
or

```
npm install multer-storage-cloudinary --legacy-peer-deps
```

- A multer storage engine for Cloudinary. Also consult the Cloudinary API.
- Raw Multer creates a temporary storage in our file system for storing the file. 
- But This package will create a temporary storage with cloudinary and then gives the cloudinary to upload. 

- Amader folder -> image -> form data -> File -> Multer -> storage in cloudinary -> url ->  req.file  -> url  -> mongoose -> mongodb

- inside multer ethis storage location will be cloudinary 

```
const upload = multer({ dest: 'uploads/' })
```
- as he does not has access to cloudinary directly so we will give him cloudinary configuration 

- cloudinary.config.ts 


```ts 
import { v2 as cloudinary } from 'cloudinary';
import { envVars } from './env';


cloudinary.config({
    cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
    api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
    api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET
})

// cloudinary.v2.uploader.upload(file, options).then(callback);
// this is the system of cloudinary but we will do it using a package.
// this package will take the file and will do the work and will return the url inside the req.file object 

export const cloudinaryUpload = cloudinary
```
- multer.config.ts 


```ts 
import multer from "multer";
import { cloudinaryUpload } from "./cloudinary.config";
import { CloudinaryStorage } from "multer-storage-cloudinary";


const storage = new CloudinaryStorage({
    cloudinary: cloudinaryUpload, // file 
    // options
    params: {
        public_id: (req, file) => {
            // My Special.Image#!@.png => 4545adsfsadf-45324263452-my-image.png
            // My Special.Image#!@.png => [My Special, Image#!@, png]

            const fileName = file.originalname
                .toLowerCase()
                .replace(/\s+/g, "-") // empty space remove replace with dash
                .replace(/\./g, "-")
                // eslint-disable-next-line no-useless-escape
                .replace(/[^a-z0-9\-\.]/g, "") // non alpha numeric - !@#$

            const extension = file.originalname.split(".").pop()

            // binary -> 0,1 hexa decimal -> 0-9 A-F base 36 -> 0-9 a-z
            // 0.2312345121 -> "0.hedfa674338sasfamx" -> 
            //452384772534
            const uniqueFileName = Math.random().toString(36).substring(2) + "-" + Date.now() + "-" + fileName + "." + extension

            return uniqueFileName
        }
    },
});

export const multerUpload = multer({ storage: storage })
```


## 32-3 Upload Single Image for Division 

- division.route.ts


```ts 
import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { createDivisionSchema, updateDivisionSchema } from "./division.validation";
import { DivisionController } from "./division.controller";
import { multerUpload } from "../../config/multer.config";



const router = Router()

/*
 {

 file : Image
 data : body text data => req.body => req.body.data
 }
*/
// Form data -> body, file

router.post(
    "/create",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    multerUpload.single("file"),
    validateRequest(createDivisionSchema),
    DivisionController.createDivision
);

export const DivisionRoutes = router

```

- division.controller.ts 


```ts 
import { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { DivisionService } from "./division.service";
import { IDivision } from "./division.interface";


const createDivision = catchAsync(async (req: Request, res: Response) => {

    const payload: IDivision = {
        ...req.body,
        thumbnail: req.file?.path
    }

    const result = await DivisionService.createDivision(payload);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Division created",
        data: result,
    });
});


export const DivisionController = {
    createDivision,
};
```

- for safety we will add this line in express 


```ts 
app.use(express.urlencoded({ extended: true }))
```

- app.ts 

```ts

import express, { Request, Response } from "express"

import cors from "cors"

import { router } from "./app/routes"
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler"
import notFound from "./app/middlewares/notFound"
import cookieParser from "cookie-parser"
import passport from "passport"
import expressSession from "express-session"

import "./app/config/passport" //we have to let the app.ts know that passport.ts file exists 
import { envVars } from "./app/config/env"

const app = express()

app.use(expressSession({
    secret: envVars.EXPRESS_SESSION_SECRET,
    resave: false, // Don’t save the session again if nothing changed.
    saveUninitialized: false // Don’t create empty sessions for users who haven’t logged in yet.
}))
app.use(passport.initialize()) // This sets up Passport in your Express app.
app.use(passport.session()) // This tells Passport to use sessions to store login info (so the user stays logged in between requests).

app.use(cookieParser()) // cookie parser added
app.use(express.json())
app.use(express.urlencoded({ extended: true })) // for multer upload
//Even though multer handles file uploads (multipart/form-data), the non-file fields (req.body) from a multipart request are not automatically parsed into usable JS objects unless this middleware is added.
app.use(cors())

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Welcome To Tour Management System"
    })
})

app.use("/api/v1", router)

// using the global error handler 
app.use(globalErrorHandler)

// Using not found route 
app.use(notFound)



export default app
```

| Middleware                               | Purpose                                   |
| ---------------------------------------- | ----------------------------------------- |
| `multerUpload.single('file')`            | Parses file field → `req.file`            |
| `express.urlencoded({ extended: true })` | Parses text fields from form → `req.body` |
| `express.json()`                         | Parses JSON payloads → `req.body`         |

- Even though multer handles file uploads (multipart/form-data), the non-file fields (req.body) from a multipart request are not automatically parsed into usable JS objects unless this middleware is added.

- update in validateRequest.ts 


```ts

import { NextFunction, Request, Response } from "express"
import { AnyZodObject } from "zod"

export const validateRequest = (zodSchema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {

    try {
        // console.log("Old Body", req.body)
        req.body = JSON.parse(req.body.data) || req.body // for multer
        req.body = await zodSchema.parseAsync(req.body)
        // console.log("New Body", req.body)
        // here data sanitization is working. 
        // Its like if we give any unwanted fields inside body it will removed. and set the properly validated data inside body and the controller will work with it. 
        next()
    } catch (error) {
        next(error)

    }
}
```

![alt text](image-4.png)


## 32-4 Upload Multiple Image For 


- validateRequest.ts update 

```ts 

import { NextFunction, Request, Response } from "express"
import { AnyZodObject } from "zod"

export const validateRequest = (zodSchema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {

    try {
        // console.log("Old Body", req.body)
        // req.body = JSON.parse(req.body.data) || req.body // for multer
        // more efficient 
        if (req.body.data) {
            req.body = JSON.parse(req.body.data)
        }
        req.body = await zodSchema.parseAsync(req.body)
        // console.log("New Body", req.body)
        // here data sanitization is working. 
        // Its like if we give any unwanted fields inside body it will removed. and set the properly validated data inside body and the controller will work with it. 
        next()
    } catch (error) {
        next(error)

    }
}
```
- tour.route.ts

```ts 
import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { TourController } from "./tour.controller";
import { createTourTypeZodSchema, createTourZodSchema, updateTourZodSchema } from "./tour.validation";
import { multerUpload } from "../../config/multer.config";


const router = express.Router();



/* --------------------- TOUR ROUTES ---------------------- */
router.get("/", TourController.getAllTours);

router.post(
    "/create",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    multerUpload.array("files"),
    validateRequest(createTourZodSchema),
    TourController.createTour
);


router.delete("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), TourController.deleteTour);




export const TourRoutes = router
```

- tour.controller.ts 


```ts 

import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { TourService } from './tour.service';
import { ITour } from './tour.interface';

const createTour = catchAsync(async (req: Request, res: Response) => {
    console.log(req.body, req.files)
    const payload: ITour = {
        ...req.body,
        images: (req.files as Express.Multer.File[]).map(file => file.path)
    }
    const result = await TourService.createTour(payload);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Tour created successfully',
        data: result,
    });
});


export const TourController = {
    createTour,
};
```

## 32-5 Delete Image from Cloudinary if API throws error.
- as its not a mongoose operation we can not use transaction rollback. But we have to prevent uploading image to cloudinary if any error happens or you can say we have to delete the uploaded images if any error happens 
- If any error happens while creating the tour we will get the error in the global error handler. From the global error handler we will delete the uploaded image in cloudinary if any error happens. 
- lets build the delete function inside cloudinary.config.ts 

```ts 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { v2 as cloudinary } from 'cloudinary';
import { envVars } from './env';
import AppError from '../errorHelpers/AppError';


cloudinary.config({
    cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
    api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
    api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET
})

// cloudinary.v2.uploader.upload(file, options).then(callback);
// this is the system of cloudinary but we will do it using a package.
// this package will take the file and will do the work and will return the url inside the req.file object 

export const deleteImageFromCloudinary = async (url: string) => {
    try {
        const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|gif|webp)$/i;
        const match = url.match(regex);

        console.log({ match })
        if (match && match[1]) {
            const public_id = match[1];
            await cloudinary.uploader.destroy(public_id)
            console.log(`File ${public_id} is deleted from cloudinary`);
        }
    } catch (error: any) {
        throw new AppError(401, "Cloudinary image deletion failed", error.message)
    }
}
export const cloudinaryUpload = cloudinary
```
- update in globalErrorHandler.ts 

```ts 
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { TErrorSources } from "../interfaces/error.types";
import { handleDuplicateError } from "../helpers/handleDuplicateError";
import { handleCastError } from "../helpers/handleCastError";
import { handleZodError } from "../helpers/handleZodError";
import { handleValidationError } from "../helpers/handleValidationError";
import { deleteImageFromCloudinary } from "../config/cloudinary.config";

export const globalErrorHandler = async (err: any, req: Request, res: Response, next: NextFunction) => {
    if (envVars.NODE_ENV === "development") {
        console.log(err);
    }

    // for cloudinary 
    if (req.file) {
        await deleteImageFromCloudinary(req.file.path)
    }

    if (req.files && Array.isArray(req.files) && req.files.length) {
        const imageUrls = (req.files as Express.Multer.File[]).map(file => file.path)
        await Promise.all(imageUrls.map(url => deleteImageFromCloudinary(url)))
    }


    // ____________

    let errorSources: TErrorSources[] = []
    let statusCode = 500
    let message = "Something Went Wrong!!"

    //Duplicate error
    if (err.code === 11000) {
        const simplifiedError = handleDuplicateError(err)
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message
    }
    // Object ID error / Cast Error
    else if (err.name === "CastError") {
        const simplifiedError = handleCastError(err)
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message
    }
    else if (err.name === "ZodError") {
        const simplifiedError = handleZodError(err)
        statusCode = simplifiedError.statusCode
        message = simplifiedError.message
        errorSources = simplifiedError.errorSources as TErrorSources[]
    }
    //Mongoose Validation Error
    else if (err.name === "ValidationError") {
        const simplifiedError = handleValidationError(err)
        statusCode = simplifiedError.statusCode;
        errorSources = simplifiedError.errorSources as TErrorSources[]
        message = simplifiedError.message
    }
    else if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message
    } else if (err instanceof Error) {
        statusCode = 500;
        message = err?.message
    }

    res.status(statusCode).json({
        success: false,
        message,
        errorSources,
        err: envVars.NODE_ENV === "development" ? err : null,
        stack: envVars.NODE_ENV === "development" ? err.stack : null
    })

}
```

## 32-6 Upload image during updating Tour and Division
- for update we can think like that a image is updated and then update operation is done after that we will delete the replaced image from the cloudinary. 

- division.route.ts 

```ts 
import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { createDivisionSchema, updateDivisionSchema } from "./division.validation";
import { DivisionController } from "./division.controller";
import { multerUpload } from "../../config/multer.config";



const router = Router()


router.post(
    "/create",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    multerUpload.single("file"),
    validateRequest(createDivisionSchema),
    DivisionController.createDivision
);

router.patch(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    multerUpload.single("file"),
    validateRequest(updateDivisionSchema),
    DivisionController.updateDivision
);
router.delete("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), DivisionController.deleteDivision);

export const DivisionRoutes = router
```
- division.controller.ts 

```ts 
import { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { DivisionService } from "./division.service";
import { IDivision } from "./division.interface";


const createDivision = catchAsync(async (req: Request, res: Response) => {

    const payload: IDivision = {
        ...req.body,
        thumbnail: req.file?.path
    }
    const result = await DivisionService.createDivision(payload);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Division created",
        data: result,
    });
});


const updateDivision = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;

    const payload: IDivision = {
        ...req.body,
        thumbnail: req.file?.path
    }

    const result = await DivisionService.updateDivision(id, payload);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Division updated",
        data: result,
    });
});



export const DivisionController = {
    createDivision,
    updateDivision,

};
```
- division.service.ts 


 ```ts 
import { deleteImageFromCloudinary } from "../../config/cloudinary.config";
import { IDivision } from "./division.interface";
import { Division } from "./division.model";

const createDivision = async (payload: IDivision) => {

    const existingDivision = await Division.findOne({ name: payload.name });
    if (existingDivision) {
        throw new Error("A division with this name already exists.");
    }


    const division = await Division.create(payload);

    return division
};


const updateDivision = async (id: string, payload: Partial<IDivision>) => {

    const existingDivision = await Division.findById(id);
    if (!existingDivision) {
        throw new Error("Division not found.");
    }

    const duplicateDivision = await Division.findOne({
        name: payload.name,
        _id: { $ne: id },
    });

    if (duplicateDivision) {
        throw new Error("A division with this name already exists.");
    }

    const updatedDivision = await Division.findByIdAndUpdate(id, payload, { new: true, runValidators: true })

    if (payload.thumbnail && existingDivision.thumbnail) {
        await deleteImageFromCloudinary(existingDivision.thumbnail)
    }

    return updatedDivision

};



export const DivisionService = {
    createDivision,
    updateDivision,

};
 ```
- remember for update we have to do the delete after successful update in service 
- for multiple file delete we have to do in different way 

- tour.route.ts

```ts 

import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { TourController } from "./tour.controller";
import { createTourTypeZodSchema, createTourZodSchema, updateTourZodSchema } from "./tour.validation";
import { multerUpload } from "../../config/multer.config";


const router = express.Router();


router.post(
    "/create",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    multerUpload.array("files"),
    validateRequest(createTourZodSchema),
    TourController.createTour
);



router.patch(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    multerUpload.array("files"),
    validateRequest(updateTourZodSchema),
    TourController.updateTour
);



export const TourRoutes = router
```

- tour.controller.ts 


```ts 


import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { TourService } from './tour.service';
import { ITour } from './tour.interface';

const createTour = catchAsync(async (req: Request, res: Response) => {
    // console.log(req.body, req.files)
    const payload: ITour = {
        ...req.body,
        images: (req.files as Express.Multer.File[]).map(file => file.path)
    }

    const result = await TourService.createTour(payload);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Tour created successfully',
        data: result,
    });
});


const updateTour = catchAsync(async (req: Request, res: Response) => {


    const payload: ITour = {
        ...req.body,
        images: (req.files as Express.Multer.File[]).map(file => file.path)
    }


    const result = await TourService.updateTour(req.params.id, payload);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Tour updated successfully',
        data: result,
    });
});


export const TourController = {
    createTour,
    updateTour,
};
```
- update in tour.interface.ts 


```ts 
deleteImages?: string[]
```

- update in tour.validation.ts 


```ts
deleteImages: z.array(z.string()).optional() // add in update
```

- tour.service.ts 

```ts 

import { tourSearchableFields } from "./tour.constant";
import { ITour, ITourType } from "./tour.interface";
import { Tour, TourType } from "./tour.model";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { deleteImageFromCloudinary } from "../../config/cloudinary.config";


const createTour = async (payload: ITour) => {
    const existingTour = await Tour.findOne({ title: payload.title });
    if (existingTour) {
        throw new Error("A tour with this title already exists.");
    }

    const tour = await Tour.create(payload)

    return tour;
};

const updateTour = async (id: string, payload: Partial<ITour>) => {

    const existingTour = await Tour.findById(id);

    if (!existingTour) {
        throw new Error("Tour not found.");
    }

    // ✅ If the user has uploaded new images AND there are existing images in the DB,
    // merge both sets together into payload.images.
    // This helps to temporarily keep both new and old images in the payload.

    if (payload.images && payload.images.length > 0 && existingTour.images && existingTour.images.length > 0) {
        payload.images = [...payload.images, ...existingTour.images]
        // 📝 This is combining newly added images with existing ones,
        // so we can later filter out deleted ones and finalize the image list.
    }

    // ✅ Now handle deleted images:
    // deletedImages array will be coming from frontend on the go. i mean if any existing image that user deleted will be stored in deletedImages array in frontend and will be coming inside payload 

    if (payload.deleteImages && payload.deleteImages.length > 0 && existingTour.images && existingTour.images.length > 0) {
        // 🧹 Step 1: Filter out the images that were marked for deletion from the DB list
        const restDBImages = existingTour.images.filter(imageUrl => !payload.deleteImages?.includes(imageUrl))

        // 📝 This gives us the images that still exist in the tour after deletion.

        // this is storing the images that is not existing is delete array 
        // there is a problem like user might delete images and add images at the same time. we have to grab the images that are newly added as well 

        // ➕ Step 2: Identify new images added by user
        const updatedPayloadImages = (payload.images || [])
            // Remove any that are marked for deletion (just in case)
            .filter(imageUrl => !payload.deleteImages?.includes(imageUrl))
            // Exclude existing non-deleted DB images to avoid duplication
            .filter(imageUrl => !restDBImages.includes(imageUrl))


        // Step 3: Merge the remaining DB images with the new images
        payload.images = [...restDBImages, ...updatedPayloadImages]
    }

// deletes from cloudinary
    const updatedTour = await Tour.findByIdAndUpdate(id, payload, { new: true });

    if (payload.deleteImages && payload.deleteImages.length > 0 && existingTour.images && existingTour.images.length > 0) {
        await Promise.all(payload.deleteImages.map(url => deleteImageFromCloudinary(url)))
    }

    return updatedTour;
};

export const TourService = {
    createTour,
    updateTour,

};

```


## 32-7 Create Set Password API and Refactor Reset Password Api to Change Password API
- Those who have been google authenticated and has no password and they want to set password. we will give them a api to set password. 
- Forget password route will have connection with reset password route 

#### Setting password for google logged in user 
- auth.route.ts 

```ts 

import { NextFunction, Request, Response, Router } from "express";
import { AuthControllers } from "./auth.controller";
import { checkAuth } from '../../middlewares/checkAuth';
import { Role } from "../user/user.interface";
import passport from "passport";

const router = Router()

router.post("/login", AuthControllers.credentialsLogin)
router.post("/refresh-token", AuthControllers.getNewAccessToken)
router.post("/logout", AuthControllers.logout)
router.post("/change-password", checkAuth(...Object.values(Role)), AuthControllers.changePassword)
router.post("/reset-password", checkAuth(...Object.values(Role)), AuthControllers.resetPassword)
router.post("/set-password", checkAuth(...Object.values(Role)), AuthControllers.setPassword)

//  /booking -> /login -> successful google login -> /booking frontend
// /login -> successful google login -> / frontend
router.get("/google", async (req: Request, res: Response, next: NextFunction) => {
    const redirect = req.query.redirect || "/"
    passport.authenticate("google", { scope: ["profile", "email"], state: redirect as string })(req, res, next)
})
// this kept get because the authentication is done by google and we have nothing to send in body 

// api/v1/auth/google/callback?state=/booking this redirect state will be added in the url by the previous auth login route
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), AuthControllers.googleCallbackController)

// this is for setting the cookies 



export const authRoutes = router
```
- auth.controller.ts 

```ts 
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express"

import { sendResponse } from "../../utils/sendResponse"
import httpStatus from 'http-status-codes';
import { AuthServices } from "./auth.service";
import { catchAsync } from "../../utils/catchAsync";
import AppError from "../../errorHelpers/AppError";
import { setAuthCookie } from "../../utils/setCookie";
import bcrypt from 'bcryptjs';
import { JwtPayload } from "jsonwebtoken";
import { createUserToken } from "../../utils/userToken";
import { envVars } from "../../config/env";
import passport from "passport";



const setPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const decodedToken = req.user as JwtPayload
    const { password } = req.body

    await AuthServices.setPassword(decodedToken.userId, password)


    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "password reset Successfully",
        data: null
    })

})



export const AuthControllers = {

    setPassword
}

```

- auth.service.ts 

```ts 
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
import AppError from '../../errorHelpers/AppError';
import { IAuthProvider, IsActive, IUser } from "../user/user.interface"
import httpStatus from 'http-status-codes';
import { User } from "../user/user.model";
import bcrypt from "bcryptjs";
import { generateToken, verifyToken } from "../../utils/jwt";
import { envVars } from '../../config/env';
import { createNewAccessTokenWithRefreshToken, createUserToken } from "../../utils/userToken";
import { JwtPayload } from "jsonwebtoken";



const setPassword = async (userId: string, plainPassword: string) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(404, "User Not Found")
        // though it will not be used because it will be checked by checkAuth(). still kept for safety 
    }

    if (user.password && user.auths.some(providerObject => providerObject.provider === "google")) {
        throw new AppError(httpStatus.BAD_REQUEST, "You have already set you password. Now you can change the password from your profile password update")
    }

    // .some() checks if at least one item in the array satisfies the given condition.
    // "Is there any object in the auths array where the provider is "google"?"

    const hashedPassword = await bcrypt.hash(
        plainPassword,
        Number(envVars.BCRYPT_SALT_ROUND)
    )

    const credentialProvider: IAuthProvider = {
        provider: "credentials",
        providerId: user.email
    }

    const auths: IAuthProvider[] = [...user.auths, credentialProvider]

    user.password = hashedPassword

    user.auths = auths

    await user.save()

}
export const AuthServices = {
    setPassword
}
```