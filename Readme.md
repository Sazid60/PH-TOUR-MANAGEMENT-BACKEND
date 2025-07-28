# PH-TOUR-MANAGEMENT-BACKEND-7

GitHub Link:

https://github.com/Apollo-Level2-Web-Dev/ph-tour-management-system-backend/tree/part-8


Task-2

https://docs.google.com/document/d/16wQ9di4Bq-LPQoxoezYVj46WP863PjR98lNgk1q71UI/edit?usp=sharing


Postman Collection 

https://github.com/Apollo-Level2-Web-Dev/ph-tour-management-system-backend/blob/part-8/Backend%20PH%20Tour%20Management%20APIs.postman_collection.json

(Download this JSON file and import in your postman)
#### what we will learn in this module?
- generating storing the otp using redis 
- sending the otp through email 
- using the otp verifying the email 
- generating invoice of payment 
- storing the invoice and sending the invoice using email. 
- aggregation pipeline 
- polishing works of the whole project 

## 33-1 Introduction to Redis, Setting and Configuring Redis
- In Here Redis is used to store the generated otp and sending the otp through email 
- In our project when we create a user by default its `verification` status is false. we have to build a mechanism by which we will be able to verify the email. for this we will use redis 

#### What is redis? 
- basically it is in memory database. 
- its store the data in our local machine like no-sql database. but there is a catch `Redis do not keep the data in ssd or hard drive ratcher it store in ram or memory`. for this reason it is called in memory database. 
- basically ram holds temporary data. when a app opens ram holds the data. This helps to make read write faster by holding data. 
- When the data is used the data is removed from the ram 
- OTP is a temporary password, so we will use redis to store it in ram. 
- Redis will give us a `ec2` server which is based on `AWS`. Itself it is a computer and has some ram and storage functionality. the OTP will be stored in storage/ram. If used or time expired it will be deleted from the ram. 
- Another works of redis is `caching` but this not our main focus right now. 
- Redis can be used as a database, cache, streaming engine, message broker, and more.

[Redis Docs](https://redis.io/docs/latest/develop/clients/nodejs/)

#### Lets Move to the Installation Part Of Redis 

- install redis 

```
npm install redis -f 

```
- setup the redis.config.ts 

```ts
/* eslint-disable no-console */
import { createClient } from 'redis';
import { envVars } from './env';

const redisClient = createClient({
    username: envVars.REDIS_USERNAME,
    password: envVars.REDIS_PASSWORD,
    socket: {
        host: envVars.REDIS_HOST,
        port: Number(envVars.REDIS_PORT)
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));

//     await redisClient.connect();
//     await redisClient.set('foo', 'bar');
//     const result = await redisClient.get('foo');
//     console.log(result)  // >>> bar

//  we will connect the redis inside the server 
export const connectRedis = async () => {
    //  we have not used try catch because already redis handled the error by using redisClient.on('error', err => console.log('Redis Client Error', err));
    if (!redisClient.isOpen) { // used this because if once connected there is no need to connect redis again 
        await redisClient.connect();
        console.log("Redis Connected !")
    }

    // await redisClient.set('foo', 'bar');
    // const result = await redisClient.get('foo');
    // console.log(result)  // >>> bar
}
```

- server.ts 

```ts 
/* eslint-disable no-console */
import { Server } from "http"

import mongoose from "mongoose"
import app from "./app";
import { envVars } from "./app/config/env";
import { seedSuperAdmin } from "./app/utils/seedSuperAdmin";
import { connectRedis } from "./app/config/redis.config";

let server: Server


const startServer = async () => {
    try {
        await mongoose.connect(envVars.DB_URL);
        console.log("Connected To MongoDb")
        server = app.listen(envVars.PORT, () => {
            console.log(`Server is Running On Port ${envVars.PORT}`)
        })
    } catch (error) {
        console.log(error)
    }
}

(async () => {
    await connectRedis() // redis connected 
    await startServer()
    await seedSuperAdmin()
})()

process.on("SIGTERM", (err) => {
    console.log("Signal Termination Happened...! Server Is Shutting Down !", err)
    if (server) {
        server.close(() => {
            process.exit(1)
        })
    }

    process.exit(1)

})

process.on("SIGINT", () => {
    console.log("I am manually Closing the server! Server Is Shutting Down !")

    // if express server is on and unhandled rejection happens close the express server using server.close()
    // then close the node server using process.exit(1)
    if (server) {
        server.close(() => {
            process.exit(1)
        })
    }

    process.exit(1)

})
process.on("unhandledRejection", () => {

    console.log("Unhandled Rejection Happened...! Server Is Shutting Down !")

    // if express server is on and unhandled rejection happens close the express server using server.close()
    // then close the node server using process.exit(1)
    if (server) {
        server.close(() => {
            process.exit(1)
        })
    }

    process.exit(1)

})

process.on("uncaughtException", (err) => {
    console.log("Uncaught Exception Happened...! Server Is Shutting Down !", err)

    // if express server is on and unhandled rejection happens close the express server using server.close()
    // then close the node server using process.exit(1)
    if (server) {
        server.close(() => {
            process.exit(1)
        })
    }

    process.exit(1)

})

//  test unhandled rejection

// Promise.reject(new Error("Opps! Unhandled Rejection Happened !....Forgot To Catch error ! "))


// TESTING uncaughtException
// throw new Error("Maamah I'm Uncaught exception error ")

```

## 33-2 Create a function to generate and send OTP by Email

- otp.route.ts 

```ts 
// src/modules/otp/otp.routes.ts
import express from "express";
import { OTPController } from "./otp.controller";

const router = express.Router();

router.post("/send", OTPController.sendOTP); // otp will be generated and stored in redis and then will be sent to email 
router.post("/verify", OTPController.verifyOTP);
// when a user uses the otp this route will verify the otp taking from the redis and compare .
//  if otp matches we will make isVerified true 

export const OtpRoutes = router;
```

- otp.controller.ts 

```ts 
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { OTPService } from "./otp.service";


const sendOTP = catchAsync(async (req: Request, res: Response) => {
    const { email, name } = req.body
    await OTPService.sendOTP(email, name)
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "OTP sent successfully",
        data: null,
    });
})

export const OTPController = {
    sendOTP,
    verifyOTP
};
```
- utils -> templates -> otp.ejs

```ejs 
<h2>Hello <%= name %>,</h2>
<p>Your OTP code is: <strong><%= otp %></strong></p>
<p>This code is valid for 2 minutes.</p>
```

- otp.service.ts

```ts 

import crypto from "crypto"
import { User } from "../user/user.model"
import AppError from "../../errorHelpers/AppError"
import { redisClient } from "../../config/redis.config"
import { sendEmail } from "../../utils/sendEmail"

const OTP_EXPIRATION = 2 * 60 // 2 minute 

const generateOtp = (length = 6) => {
    // 6 digit otp 
    const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString()
    // 10 ** 5 => 10 * 10 *10 *10 *10 * 10 => 1000000

    return otp
}


const sendOTP = async (email: string, name: string) => {
    const user = await User.findOne({ email })

    if (!user) {
        throw new AppError(404, "User not found")
    }

    if (user.isVerified) {
        throw new AppError(401, "You are already verified")
    }

    const otp = generateOtp();

    const redisKey = `otp${email}`



    // storing in redis 

    // await redisClient.set(Key, value,options)
    await redisClient.set(redisKey, otp, {
        expiration: {
            type: "EX", // this is for telling the time type milisec or sec or any  
            value: OTP_EXPIRATION
        }
    })

    //  now send the otp in email 

    await sendEmail({
        to: email,
        subject: "Your OTP Code",
        templateName: "otp",
        templateData: {
            name: name,
            otp: otp
        }
    })


};

export const OTPService = {
    sendOTP,
    verifyOTP
}
```

## 33-3 Using Redis Database to Verify the OTP
- otp.controller.ts 

```ts 
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { OTPService } from "./otp.service";


const sendOTP = catchAsync(async (req: Request, res: Response) => {
    const { email, name } = req.body
    await OTPService.sendOTP(email, name)
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "OTP sent successfully",
        data: null,
    });
})

const verifyOTP = catchAsync(async (req: Request, res: Response) => {
    const { email, otp } = req.body
    await OTPService.verifyOTP(email, otp)
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "OTP verified successfully",
        data: null,
    });
})

export const OTPController = {
    sendOTP,
    verifyOTP
};
```

- otp.service.ts 

```ts 

import crypto from "crypto"
import { User } from "../user/user.model"
import AppError from "../../errorHelpers/AppError"
import { redisClient } from "../../config/redis.config"
import { sendEmail } from "../../utils/sendEmail"

const OTP_EXPIRATION = 5 * 60 // 2 minute 

const generateOtp = (length = 6) => {
    // 6 digit otp 
    const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString()
    // 10 ** 5 => 10 * 10 *10 *10 *10 * 10 => 1000000

    return otp
}


const sendOTP = async (email: string, name: string) => {
    const user = await User.findOne({ email })

    if (!user) {
        throw new AppError(404, "User not found")
    }

    if (user.isVerified) {
        throw new AppError(401, "You are already verified")
    }

    const otp = generateOtp();

    const redisKey = `otp:${email}`



    // storing in redis 

    // await redisClient.set(Key, value,options)
    await redisClient.set(redisKey, otp, {
        expiration: {
            type: "EX", // this is for telling the time type milisec or sec or any  
            value: OTP_EXPIRATION
        }
    })

    //  now send the otp in email 

    await sendEmail({
        to: email,
        subject: "Your OTP Code",
        templateName: "otp",
        templateData: {
            name: name,
            otp: otp
        }
    })


};

const verifyOTP = async (email: string, otp: string) => {
    // const user = await User.findOne({ email, isVerified: false })
    const user = await User.findOne({ email })

    if (!user) {
        throw new AppError(404, "User not found")
    }

    if (user.isVerified) {
        throw new AppError(401, "You are already verified")
    }

    const redisKey = `otp:${email}`

    console.log(redisKey)


    const savedOtp = await redisClient.get(redisKey)

    console.log(savedOtp)

    if (!savedOtp) {
        throw new AppError(401, "Invalid OTP");
    }

    if (savedOtp !== otp) {
        throw new AppError(401, "Invalid OTP");
    }


    await Promise.all([
        User.updateOne({ email }, { isVerified: true }, { runValidators: true }),
        redisClient.del([redisKey])
    ])

};


export const OTPService = {
    sendOTP,
    verifyOTP
}
```

## 33-4 Create a function to generate pdf of the invoice of booking and payment of a tour
- so far we are sending a success message to frontend after successful payment. now we will send email and make a pdf and send the pdf link in the email 
- we will use a package named `pdf kit` for generating pdf 

[pdfkit](https://www.npmjs.com/package/pdfkit)

```
npm i pdfkit -f
```

```
npm i @types/pdfkit -f
```

- we will generate a pdf and store it somewhere and give in email the download link and the link will be stored in database as well inside `invoiceUrl`.
- we will use pdfkit foe generating pdf 
- A JavaScript PDF generation library for Node and the browser.
- PDFKit is a PDF document generation library for Node and the browser that makes creating complex, multi-page, printable documents easy. The API embraces chainability, and includes both low level functions as well as abstractions for higher level functionality. The PDFKit API is designed to be simple, so generating complex documents is often as simple as a few function calls.

#### Lets generate a function for the generating pdf 
- We will use stream buffer to create a pdf 
- When generating a PDF, PDFKit does not create the entire file in one go.
- Instead:
    1. It streams chunks of binary data (pieces of the PDF file) as they are generated.
    2. Each chunk is a Uint8Array (raw byte data).
- cannot use those chunks individually.
- need to collect all chunks → combine them → get one complete PDF file.
- Thats We create an array to temporarily store all chunks.

```ts 
const buffer: Uint8Array[] = [];
```
#### How Does This Method Work?

##### Step 1: Listen for "data"

```ts 
doc.on("data", (chunk) => buffer.push(chunk));
```
- Each time PDFKit generates part of the PDF, it emits a "data" event.
- That chunk is a piece of binary data.
- We push it into our buffer array.

##### doc.on("end", () => resolve(Buffer.concat(buffer)));
```ts
doc.on("end", () => resolve(Buffer.concat(buffer)));

```
- "end" means PDF generation is finished.

- At that moment:

    1. buffer contains multiple small Uint8Array chunks.
    2. Buffer.concat(buffer) merges them into one large Buffer.
    3. That Buffer now represents the entire PDF file.

##### 3. Why Use Buffer.concat Instead of a String?

- PDF files are binary data (not plain text).
- Using strings would corrupt the data.
- Buffer in Node.js is a special class for handling binary data correctly.
- Buffer.concat:

    1. Allocates enough memory to hold all chunks,
    2. Copies each chunk in order,
    3. Returns a single continuous block representing the PDF file.

- so the flow is we are grabbing the info inside function and pdfkit is generating the pdf gradually and making buffer?

- utils -> invoice.ts 

```ts 
/* eslint-disable @typescript-eslint/no-explicit-any */
import PDFDocument from "pdfkit";
import AppError from "../errorHelpers/AppError";

export interface IInvoiceData {
    transactionId: string;
    bookingDate: Date;
    userName: string;
    tourTitle: string;
    guestCount: number;
    totalAmount: number;
}

export const generatePdf = async (invoiceData: IInvoiceData)=> {
    try {
        // being async function we have explicitly used Promise here because we are using stream system to load the data. 


        // async/await works only with functions that already return a promise.
        // doc.on("end", ...) is callback-style, so you must manually wrap it in a Promise to make it await-compatible.
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: "A4", margin: 50 }) 
            // Creates a new PDFDocument instance (PDFKit). Not explaining PDFKit specifics.
            const buffer: Uint8Array[] = []; 
            //Creates an array named buffer to temporarily store chunks of binary data emitted by the PDF generator.
            // here we are taking an array of buffer which is a type of  UNit8Array[] made for buffer 
            // in this array we will store the buffered data in chunk by chunk


            doc.on("data", (chunk) => buffer.push(chunk)) 
            // wEvery time the document emits a "data" event (a chunk of PDF bytes), push it into buffer.
            doc.on("end", () => resolve(Buffer.concat(buffer)))
            //when all chunks are loaded we will concat the chunks and add it taking from the buffer.
            //here big B buffer is coming from javascript its grabbing the buffer array
            // Concatenate all chunks from buffer into a single Buffer,
            doc.on("error", (err) => reject(err))

            //PDF Content
            doc.fontSize(20).text("Invoice", { align: "center" });
            doc.moveDown()
            doc.fontSize(14).text(`Transaction ID : ${invoiceData.transactionId}`)
            doc.text(`Booking Date : ${invoiceData.bookingDate}`)
            doc.text(`Customer : ${invoiceData.userName}`)

            doc.moveDown();
            doc.text(`Tour: ${invoiceData.tourTitle}`);
            doc.text(`Guests: ${invoiceData.guestCount}`);
            doc.text(`Total Amount: $${invoiceData.totalAmount.toFixed(2)}`);
            doc.moveDown();

            doc.text("Thank you for booking with us!", { align: "center" });
            doc.end()

        })

    } catch (error: any) {
        console.log(error);
        throw new AppError(401, `Pdf creation error ${error.message}`)
    }
}
```

- here only the buffer is created through the function 
- now from the buffer we have to create a pdf and upload in cloudinary and send the uploaded link to email and as well we have to store te link in database `invoiceUrl`

## 33-5 Send Email of the PDF to user After Successful payment with SSLCommerz
- utils ->  templates- >invoice.ejs 

```js
<h1>Invoice for Booking: <%= tourTitle %></h1>
<p><strong>Payment ID:</strong> <%= transactionId %></p>
<p><strong>Amount Paid:</strong> $<%= totalAmount %></p>
<p><strong>Booking Date:</strong> <%= bookingDate %></p>
<p><strong>Guest Count:</strong> <%= guestCount %></p>
<p><strong>User:</strong> <%= userName %></p>
<p>Thank you for your booking!</p>

```
- 

- utils -> invoice.ts 

```ts 
/* eslint-disable @typescript-eslint/no-explicit-any */
import PDFDocument from "pdfkit";
import AppError from "../errorHelpers/AppError";

export interface IInvoiceData {
    transactionId: string;
    bookingDate: Date;
    userName: string;
    tourTitle: string;
    guestCount: number;
    totalAmount: number;
}

export const generatePdf = async (invoiceData: IInvoiceData) : Promise<Buffer<ArrayBufferLike>>=> 
// here Promise<Buffer<ArrayBufferLike>> type is given since we have gave gave in emailjs that the attachment content can be string or buffer .
{
    try {
        // being async function we have explicitly used Promise here because we are using stream system to load the data. 


        // async/await works only with functions that already return a promise.
        // doc.on("end", ...) is callback-style, so you must manually wrap it in a Promise to make it await-compatible.
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: "A4", margin: 50 }) 
            // Creates a new PDFDocument instance (PDFKit). Not explaining PDFKit specifics.
            const buffer: Uint8Array[] = []; 
            //Creates an array named buffer to temporarily store chunks of binary data emitted by the PDF generator.
            // here we are taking an array of buffer which is a type of  UNit8Array[] made for buffer 
            // in this array we will store the buffered data in chunk by chunk


            doc.on("data", (chunk) => buffer.push(chunk)) 
            // wEvery time the document emits a "data" event (a chunk of PDF bytes), push it into buffer.
            doc.on("end", () => resolve(Buffer.concat(buffer)))
            //when all chunks are loaded we will concat the chunks and add it taking from the buffer.
            //here big B buffer is coming from javascript its grabbing the buffer array
            // Concatenate all chunks from buffer into a single Buffer,
            doc.on("error", (err) => reject(err))

            //PDF Content
            doc.fontSize(20).text("Invoice", { align: "center" });
            doc.moveDown()
            doc.fontSize(14).text(`Transaction ID : ${invoiceData.transactionId}`)
            doc.text(`Booking Date : ${invoiceData.bookingDate}`)
            doc.text(`Customer : ${invoiceData.userName}`)

            doc.moveDown();
            doc.text(`Tour: ${invoiceData.tourTitle}`);
            doc.text(`Guests: ${invoiceData.guestCount}`);
            doc.text(`Total Amount: $${invoiceData.totalAmount.toFixed(2)}`);
            doc.moveDown();

            doc.text("Thank you for booking with us!", { align: "center" });
            doc.end()

        })

    } catch (error: any) {
        console.log(error);
        throw new AppError(401, `Pdf creation error ${error.message}`)
    }
}
```

- payment.service.ts 

```ts 
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { BOOKING_STATUS } from "../booking/booking.interface";
import { Booking } from "../booking/booking.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { PAYMENT_STATUS } from "./payment.interface";
import { Payment } from "./payment.model";
import { generatePdf, IInvoiceData } from "../../utils/invoice";
import { ITour } from "../tour/tour.interface";
import { IUser } from "../user/user.interface";
import { sendEmail } from "../../utils/sendEmail";

const initPayment = async (bookingId: string) => {

    const payment = await Payment.findOne({ booking: bookingId })

    if (!payment) {
        throw new AppError(httpStatus.NOT_FOUND, "Payment Not Found. You have not booked this tour")
    }

    const booking = await Booking.findById(payment.booking)

    const userAddress = (booking?.user as any).address
    const userEmail = (booking?.user as any).email
    const userPhoneNumber = (booking?.user as any).phone
    const userName = (booking?.user as any).name

    const sslPayload: ISSLCommerz = {
        address: userAddress,
        email: userEmail,
        phoneNumber: userPhoneNumber,
        name: userName,
        amount: payment.amount,
        transactionId: payment.transactionId
    }

    const sslPayment = await SSLService.sslPaymentInit(sslPayload)

    return {
        paymentUrl: sslPayment.GatewayPageURL
    }

};
const successPayment = async (query: Record<string, string>) => {

    // Update Booking Status to COnfirm 
    // Update Payment Status to PAID

    const session = await Booking.startSession();
    session.startTransaction()

    try {


        const updatedPayment = await Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: PAYMENT_STATUS.PAID,
        }, { new: true, runValidators: true, session: session })

        // this is a safety check though it wil not be used. safety will be checked earlier 
        if (!updatedPayment) {
            throw new AppError(401, "Payment not found")
        }

        // we are holding the file as we need to generate pdf and need some information
        const updatedBooking = await Booking
            .findByIdAndUpdate(
                updatedPayment?.booking,
                { status: BOOKING_STATUS.COMPLETE },
                { new: true, runValidators: true, session }
            )
            .populate("tour", "title")
            .populate("user", "name email")
        // we are population since we are just storing the id and we need the info for generating the  invoice pdf 

        //  this is a safety check though it wil not be used. safety will be checked earlier 
        if (!updatedBooking) {
            throw new AppError(401, "Booking not found")
        }

        const invoiceData: IInvoiceData = {
            bookingDate: updatedBooking.createdAt as Date,
            guestCount: updatedBooking.guestCount,
            totalAmount: updatedPayment.amount,
            tourTitle: (updatedBooking.tour as unknown as ITour).title, // as we have populated
            transactionId: updatedPayment.transactionId,
            userName: (updatedBooking.user as unknown as IUser).name // as we populated
        }
        const pdfBuffer = await generatePdf(invoiceData)

          await sendEmail({
            to: (updatedBooking.user as unknown as IUser).email,
            subject: "Your Booking Invoice",
            templateName: "invoice",
            templateData: invoiceData,
            attachments: [
                {
                    filename: "invoice.pdf",
                    content: pdfBuffer,
                    contentType: "application/pdf"
                }
            ]
        })



        await session.commitTransaction(); //transaction
        session.endSession()
        return { success: true, message: "Payment Completed Successfully" }
    } catch (error) {
        await session.abortTransaction(); // rollback
        session.endSession()
        // throw new AppError(httpStatus.BAD_REQUEST, error) ❌❌
        throw error
    }
};

export const PaymentService = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
};
```

## 33-6 Upload Invoice PDF to Cloudinary and get Invoice Download URL

- Now lets upload the generated invoice pdf to the cloudinary. 
- Here `multer` will not help us because we are not taking the file from request body we are generating the file on the go after successful payment.  
- For this reason we have to upload manually in cloudinary. 
- WE have to make a function for cloudinary manual upload. 
- Remember we will use buffer and streaming system upload. for this reason we will listen the buffer and upload the buffer in cloudinary.

#### Use case of stream buffer
- **Stream** = “Serve tea directly into the guest’s cup as it’s pouring.”
- **Buffer** = “Fill the entire teapot, then serve.”
- **Stream + Buffer** = “Collect tea drops in a pot (stream), then later serve the full pot (buffer).”

- this is the reason we will use stream and buffer at the same time 

#### Lets configure the cloudinary.config.ts for streaming upload(manual) in cloudinary
- we already have a Buffer generated from the generatePdf function
- now we need to convert the buffer to a stream for uploading into cloudinary as stream 
- full procedure 

```
Buffer (PDF)  
   ↓  
Node.js Stream (upload_stream)  
   ↓  
Cloudinary API  
   ↓  
Upload complete → returns Cloudinary URL & metadata.


| Method         | What it does                  | Does it close the stream? |
| -------------- | ----------------------------- | ------------------------- |
| `.write(data)` | Sends data to the stream.     | ❌ No, keeps stream open.  |
| `.end(data)`   | Sends final data & closes it. | ✅ Yes.                    |


```
- cloudinary.config.ts

```ts
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { v2 as cloudinary } from 'cloudinary';
import { envVars } from './env';
import AppError from '../errorHelpers/AppError';

import stream from "stream"
import { UploadApiResponse } from 'cloudinary';


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
// This function converts your Buffer into a stream and uploads it.
export const uploadBufferToCloudinary = async (buffer: Buffer, fileName: string) : Promise<UploadApiResponse | undefined>  => {
    // It returns a Promise that will eventually resolve to "Hello".

    try {
        // cloudinary upload function doesn’t return a Promise, so you must manually wrap it

        return new Promise((resolve, reject) => {
            const public_id = `pdf/${fileName}-${Date.now()}`


            // converting the buffer in stream 
            const bufferStream = new stream.PassThrough()
            // PassThrough is a special Node.js stream that lets you push a Buffer and treat it as a readable stream.
            bufferStream.end(buffer)

            // Writes the last chunk of data (buffer) to the stream.


            // template cloudinary.uploader.upload_stream(options, callback)

            cloudinary.uploader.upload_stream(
                {
                    resource_type: "auto",
                    public_id: public_id,
                    folder: "pdf"
                },
                (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result)
                }
            ).end(buffer)
            // You immediately .end(buffer) → This writes the entire buffer to that stream.
            // .end(buffer) Writes your entire buffer to the Cloudinary stream.
            // Closes the stream so Cloudinary can finish uploading.



        })
    } catch (error: any) {
        console.log(error);
        throw new AppError(401, `Error uploading file ${error.message}`)
    }
}
export const cloudinaryUpload = cloudinary
```

- payment.service.ts 

```ts 
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { BOOKING_STATUS } from "../booking/booking.interface";
import { Booking } from "../booking/booking.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { PAYMENT_STATUS } from "./payment.interface";
import { Payment } from "./payment.model";
import { generatePdf, IInvoiceData } from "../../utils/invoice";
import { ITour } from "../tour/tour.interface";
import { IUser } from "../user/user.interface";
import { sendEmail } from "../../utils/sendEmail";
import { uploadBufferToCloudinary } from "../../config/cloudinary.config";

const successPayment = async (query: Record<string, string>) => {

    // Update Booking Status to Confirm 
    // Update Payment Status to PAID

    const session = await Booking.startSession();
    session.startTransaction()

    try {


        const updatedPayment = await Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: PAYMENT_STATUS.PAID,
        }, { new: true, runValidators: true, session: session })

        // this is a safety check though it wil not be used. safety will be checked earlier 
        if (!updatedPayment) {
            throw new AppError(401, "Payment not found")
        }

        // we are holding the file as we need to generate pdf and need some information
        const updatedBooking = await Booking
            .findByIdAndUpdate(
                updatedPayment?.booking,
                { status: BOOKING_STATUS.COMPLETE },
                { new: true, runValidators: true, session }
            )
            .populate("tour", "title")
            .populate("user", "name email")
        // we are population since we are just storing the id and we need the info for generating the  invoice pdf 

        //  this is a safety check though it wil not be used. safety will be checked earlier 
        if (!updatedBooking) {
            throw new AppError(401, "Booking not found")
        }

        const invoiceData: IInvoiceData = {
            bookingDate: updatedBooking.createdAt as Date,
            guestCount: updatedBooking.guestCount,
            totalAmount: updatedPayment.amount,
            tourTitle: (updatedBooking.tour as unknown as ITour).title, // as we have populated
            transactionId: updatedPayment.transactionId,
            userName: (updatedBooking.user as unknown as IUser).name // as we populated
        }
        const pdfBuffer = await generatePdf(invoiceData)

        // uploading in cloudinary 
// using any for now 
        const cloudinaryResult  = await uploadBufferToCloudinary(pdfBuffer, "invoice")
        // console.log({cloudinaryResult})

        if(!cloudinaryResult){
            throw new AppError(401, "Error Uploading Pdf")
        }

        // update our booking 

        await Payment.findByIdAndUpdate(updatedPayment._id, {invoiceUrl : cloudinaryResult.secure_url}, {runValidators:true, session})

          await sendEmail({
            to: (updatedBooking.user as unknown as IUser).email,
            subject: "Your Booking Invoice",
            templateName: "invoice",
            templateData: invoiceData,
            attachments: [
                {
                    filename: "invoice.pdf",
                    content: pdfBuffer,
                    contentType: "application/pdf"
                }
            ]
        })



        await session.commitTransaction(); //transaction
        session.endSession()
        return { success: true, message: "Payment Completed Successfully" }
    } catch (error) {
        await session.abortTransaction(); // rollback
        session.endSession()
        // throw new AppError(httpStatus.BAD_REQUEST, error) ❌❌
        throw error
    }
};



export const PaymentService = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
};
```

#### lets make a route for getting the get downloadInvoice url
- payment.route.ts 


```ts 
import express from "express";
import { PaymentController } from "./payment.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";


const router = express.Router();


router.post("/init-payment/:bookingId", PaymentController.initPayment);
router.post("/success", PaymentController.successPayment);
router.post("/fail", PaymentController.failPayment);
router.post("/cancel", PaymentController.cancelPayment);
router.get("/invoice/:paymentId", checkAuth(...Object.values(Role)), PaymentController.getInvoiceDownloadUrl);
export const PaymentRoutes = router;
```
- payment.controller.ts 

```ts
import { Request, Response } from "express";
import { envVars } from "../../config/env";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentService } from "./payment.service";

const successPayment = catchAsync(async (req: Request, res: Response) => {
    const query = req.query
    const result = await PaymentService.successPayment(query as Record<string, string>)

    if (result.success) {
        res.redirect(`${envVars.SSL.SSL_SUCCESS_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`)
    }
});


const getInvoiceDownloadUrl = catchAsync(
    async (req: Request, res: Response) => {
        const { paymentId } = req.params;
        const result = await PaymentService.getInvoiceDownloadUrl(paymentId);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Invoice download URL retrieved successfully",
            data: result,
        });
    }
);

export const PaymentController = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    getInvoiceDownloadUrl
};
```

- payment.service.ts

```ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { BOOKING_STATUS } from "../booking/booking.interface";
import { Booking } from "../booking/booking.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { PAYMENT_STATUS } from "./payment.interface";
import { Payment } from "./payment.model";
import { generatePdf, IInvoiceData } from "../../utils/invoice";
import { ITour } from "../tour/tour.interface";
import { IUser } from "../user/user.interface";
import { sendEmail } from "../../utils/sendEmail";
import { uploadBufferToCloudinary } from "../../config/cloudinary.config";


const successPayment = async (query: Record<string, string>) => {

    // Update Booking Status to COnfirm 
    // Update Payment Status to PAID

    const session = await Booking.startSession();
    session.startTransaction()

    try {


        const updatedPayment = await Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: PAYMENT_STATUS.PAID,
        }, { new: true, runValidators: true, session: session })

        // this is a safety check though it wil not be used. safety will be checked earlier 
        if (!updatedPayment) {
            throw new AppError(401, "Payment not found")
        }

        // we are holding the file as we need to generate pdf and need some information
        const updatedBooking = await Booking
            .findByIdAndUpdate(
                updatedPayment?.booking,
                { status: BOOKING_STATUS.COMPLETE },
                { new: true, runValidators: true, session }
            )
            .populate("tour", "title")
            .populate("user", "name email")
        // we are population since we are just storing the id and we need the info for generating the  invoice pdf 

        //  this is a safety check though it wil not be used. safety will be checked earlier 
        if (!updatedBooking) {
            throw new AppError(401, "Booking not found")
        }

        const invoiceData: IInvoiceData = {
            bookingDate: updatedBooking.createdAt as Date,
            guestCount: updatedBooking.guestCount,
            totalAmount: updatedPayment.amount,
            tourTitle: (updatedBooking.tour as unknown as ITour).title, // as we have populated
            transactionId: updatedPayment.transactionId,
            userName: (updatedBooking.user as unknown as IUser).name // as we populated
        }
        const pdfBuffer = await generatePdf(invoiceData)

        // uploading in cloudinary 
        // using any for now 
        const cloudinaryResult  = await uploadBufferToCloudinary(pdfBuffer, "invoice")
        // console.log({cloudinaryResult})

        if(!cloudinaryResult){
            throw new AppError(401, "Error Uploading Pdf")
        }

        // update our booking 

        await Payment.findByIdAndUpdate(updatedPayment._id, {invoiceUrl : cloudinaryResult.secure_url}, {runValidators:true, session})

          await sendEmail({
            to: (updatedBooking.user as unknown as IUser).email,
            subject: "Your Booking Invoice",
            templateName: "invoice",
            templateData: invoiceData,
            attachments: [
                {
                    filename: "invoice.pdf",
                    content: pdfBuffer,
                    contentType: "application/pdf"
                }
            ]
        })



        await session.commitTransaction(); //transaction
        session.endSession()
        return { success: true, message: "Payment Completed Successfully" }
    } catch (error) {
        await session.abortTransaction(); // rollback
        session.endSession()
        // throw new AppError(httpStatus.BAD_REQUEST, error) ❌❌
        throw error
    }
};

const getInvoiceDownloadUrl = async (paymentId: string) => {
    const payment = await Payment.findById(paymentId)
        .select("invoiceUrl")

    if (!payment) {
        throw new AppError(401, "Payment not found")
    }

    if (!payment.invoiceUrl) {
        throw new AppError(401, "No invoice found")
    }

    return payment.invoiceUrl
};


export const PaymentService = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    getInvoiceDownloadUrl
};
```

## 33-7 Refactoring User APIs, Configuring CORS for Frontend

- update user.route.ts 

```ts 

import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { userControllers } from "./user.controller";

import { createUserZodSchema, updateUserZodSchema } from "./user.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "./user.interface";



const router = Router()



router.get("/all-users", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), userControllers.getAllUsers)

router.get("/me", checkAuth(...Object.values(Role)), userControllers.getMe)

router.post("/register",
    validateRequest(createUserZodSchema),
    userControllers.createUser)

router.patch("/:id", validateRequest(updateUserZodSchema), checkAuth(...Object.values(Role)), userControllers.updateUser)
router.get("/:id",checkAuth(Role.ADMIN, Role.SUPER_ADMIN), userControllers.getSingleUser)

export const UserRoutes = router
```
- updated user.validation.ts 

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
    // password: z
    //     .string({ invalid_type_error: "Password must be string" })
    //     .min(8, { message: "Password must be at least 8 characters long." })
    //     .regex(/^(?=.*[A-Z])/, {
    //         message: "Password must contain at least 1 uppercase letter.",
    //     })
    //     .regex(/^(?=.*[!@#$%^&*])/, {
    //         message: "Password must contain at least 1 special character.",
    //     })
    //     .regex(/^(?=.*\d)/, {
    //         message: "Password must contain at least 1 number.",
    //     }).optional(),
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

- updated user.service.ts 

```ts 
import AppError from "../../errorHelpers/AppError";
import { IAuthProvider, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import httpStatus from 'http-status-codes';
import bcryptjs from "bcryptjs";
import { JwtPayload } from "jsonwebtoken";
// import { envVars } from "../../config/env";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { userSearchableFields } from "./user.constant";

const createUser = async (payload: Partial<IUser>) => {

    const { email, password, ...rest } = payload

    const isUserExist = await User.findOne({ email })

    if (isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Already Exists")
    }

    const hashedPassword = await bcryptjs.hash(password as string, 10)
    // const isPasswordMatch = await bcryptjs.compare("password as string", hashedPassword) //compares password 



    // // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    // const authProvider: IAuthProvider = {provider : "credentials", providerId : email!}


    const authProvider: IAuthProvider = { provider: "credentials", providerId: email as string }

    const user = await User.create({
        email,
        password: hashedPassword,
        auths: [authProvider],
        ...rest
    })

    return user
}

const getAllUsers = async (query: Record<string, string>) => {

    const queryBuilder = new QueryBuilder(User.find(), query)
    const usersData = queryBuilder
        .filter()
        .search(userSearchableFields)
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        usersData.build(),
        queryBuilder.getMeta()
    ])

    return {
        data,
        meta
    }
};
// update User 

const updateUser = async (userId: string, payload: Partial<IUser>, decodedToken: JwtPayload) => {

    const ifUserExist = await User.findById(userId);

    // new
    if (decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE) {
        if (userId !== decodedToken.userId) {
            throw new AppError(httpStatus.FORBIDDEN, "You are unauthorized to update another user's profile");
        }
    }

    if (!ifUserExist) {
        throw new AppError(httpStatus.NOT_FOUND, "User Not Found")
    }

    // new
    if (decodedToken.role === Role.ADMIN && ifUserExist.role === Role.SUPER_ADMIN) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to update a super admin profile");
    }

    /**
     * email - can not update
     * name, phone, password address
     * password - re hashing
     *  only admin superadmin - role, isDeleted...
     * 
     * promoting to superadmin - superadmin
     */

    if (payload.role) {
        if (decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE) {
            throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
        }

        // if (payload.role === Role.SUPER_ADMIN && decodedToken.role === Role.ADMIN) {
        //     throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
        // }
    }

    if (payload.isActive || payload.isDeleted || payload.isVerified) {
        if (decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE) {
            throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
        }
    }

    // new update 

    // if (payload.password) {
    //     payload.password = await bcryptjs.hash(payload.password, envVars.bcryptjs_SALT_ROUND)
    // }

    const newUpdatedUser = await User.findByIdAndUpdate(userId, payload, { new: true, runValidators: true })

    return newUpdatedUser
}

const getSingleUser = async (id: string) => {
    const user = await User.findById(id).select("-password");
    return {
        data: user
    }
};
const getMe = async (userId: string) => {
    const user = await User.findById(userId).select("-password");
    return {
        data: user
    }
};

export const userServices = {
    createUser,
    getAllUsers,
    updateUser,
    getSingleUser,
    getMe
}
```

- updated for cors app.ts 

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
app.use(cors({
    origin : envVars.FRONTEND_URL,
    credentials : true //have to use this for setting the token in cookies 
}))

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

## 33-8 Creating Dashboard Analytics API, User Stats
- from now we will work on mongoose aggregation 
- lets see all in next module 


## 33-9 Creating Dashboard Analytics API, Tour Stats and 33-10 Complete Tour Stats API

- stat.route.ts

```ts
import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { StatsController } from "./stats.controller";

const router = express.Router();

router.get(
    "/booking",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    StatsController.getBookingStats
);
router.get(
    "/payment",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    StatsController.getPaymentStats
);
router.get(
    "/user",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    StatsController.getUserStats
);
router.get(
    "/tour",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    StatsController.getTourStats
);

export const StatsRoutes = router;
```

- stat.controller.ts 

```ts 
// controllers/stats.controller.ts
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { StatsService } from "./stats.service";

const getBookingStats = catchAsync(async (req: Request, res: Response) => {
    const stats = await StatsService.getBookingStats();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Booking stats fetched successfully",
        data: stats,
    });
});

const getPaymentStats = catchAsync(async (req: Request, res: Response) => {
    const stats = await StatsService.getPaymentStats();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Payment stats fetched successfully",
        data: stats,
    });
});

const getUserStats = catchAsync(async (req: Request, res: Response) => {
    const stats = await StatsService.getUserStats();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User stats fetched successfully",
        data: stats,
    });
});

const getTourStats = catchAsync(async (req: Request, res: Response) => {
    const stats = await StatsService.getTourStats();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Tour stats fetched successfully",
        data: stats,
    });
});

export const StatsController = {
    getBookingStats,
    getPaymentStats,
    getUserStats,
    getTourStats,
};
```

- stat.service.ts 

```ts
import { Booking } from "../booking/booking.model";
import { Tour } from "../tour/tour.model";
import { IsActive } from "../user/user.interface";
import { User } from "../user/user.model";



const now = new Date();
const sevenDaysAgo = new Date(now).setDate(now.getDate() - 7);
const thirtyDaysAgo = new Date(now).setDate(now.getDate() - 30);

const getUserStats = async () => {
    const totalUsersPromise = User.countDocuments()

    const totalActiveUsersPromise = User.countDocuments({ isActive: IsActive.ACTIVE })
    const totalInActiveUsersPromise = User.countDocuments({ isActive: IsActive.INACTIVE })
    const totalBlockedUsersPromise = User.countDocuments({ isActive: IsActive.BLOCKED })

    const newUsersInLast7DaysPromise = User.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
    })
    const newUsersInLast30DaysPromise = User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
    })

    const usersByRolePromise = User.aggregate([
        // stage-1  :  Grouping users by role and count total users in each role
        {
            $group: {
                _id: "$role",
                count: { $sum: 1 }
            }
        }
    ])

    const [totalUsers, totalActiveUsers, totalInActiveUsers, totalBlockedUsers, newUsersInLast7Days, newUsersInLast30Days, usersByRole] = await Promise.all([
        totalUsersPromise,
        totalActiveUsersPromise,
        totalInActiveUsersPromise,
        totalBlockedUsersPromise,
        newUsersInLast7DaysPromise,
        newUsersInLast30DaysPromise,
        usersByRolePromise
    ])
    return {
        totalUsers,
        totalActiveUsers,
        totalInActiveUsers,
        totalBlockedUsers,
        newUsersInLast7Days,
        newUsersInLast30Days,
        usersByRole
    }

}

const getTourStats = async () => {


    /**
 * await Tour.updateMany(
        {
            // Only update where tourType or division is stored as a string
            $or: [
                { tourType: { $type: "string" } },
                { division: { $type: "string" } }
            ]
        },
        [
            {
                $set: {
                    tourType: { $toObjectId: "$tourType" },
                    division: { $toObjectId: "$division" }
                }
            }
        ]
    );
 */
    const totalTourPromise = Tour.countDocuments();

    const totalTourByTourTypePromise = Tour.aggregate([
        // stage-1 : connect Tour Type model - lookup stage
        {
            $lookup: {
                from: "tourtypes",
                localField: "tourType",
                foreignField: "_id",
                as: "type"
            }
        },
        // this will give us array of types so we have to do unwind 
        //stage - 2 : unwind the array to object

        {
            $unwind: "$type"
        },

        //stage - 3 : grouping tour type
        {
            $group: {
                _id: "$type.name",
                count: { $sum: 1 }
            }
        }
    ])

    const avgTourCostPromise = Tour.aggregate([
        //Stage-1 : group the cost from, do sum, and average the sum
        {
            $group: {
                _id: null,
                avgCostFrom: { $avg: "$costFrom" }
            }
        }
    ])

    const totalTourByDivisionPromise = Tour.aggregate([
        // stage-1 : connect Division model - lookup stage
        {
            $lookup: {
                from: "divisions",
                localField: "division",
                foreignField: "_id",
                as: "division"
            }
        },
        //stage - 2 : unwind the array to object

        {
            $unwind: "$division"
        },

        //stage - 3 : grouping tour type
        {
            $group: {
                _id: "$division.name",
                count: { $sum: 1 }
            }
        }
    ])

    const totalHighestBookedTourPromise = Booking.aggregate([
        // stage-1 : Group the tour
        {
            $group: {
                _id: "$tour",
                bookingCount: { $sum: 1 }
            }
        },

        //stage-2 : sort the tour

        {
            $sort: { bookingCount: -1 }
        },

        //stage-3 : sort
        {
            $limit: 5
        },

        //stage-4 lookup stage
        {
            $lookup: {
                from: "tours",
                let: { tourId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$_id", "$$tourId"] }
                        }
                    }
                ],
                as: "tour"
            }
        },
        //stage-5 unwind stage
        { $unwind: "$tour" },

        //stage-6 Project stage

        {
            $project: {
                bookingCount: 1,
                "tour.title": 1,
                "tour.slug": 1
            }
        }
    ])

    const [totalTour, totalTourByTourType, avgTourCost, totalTourByDivision, totalHighestBookedTour] = await Promise.all([
        totalTourPromise,
        totalTourByTourTypePromise,
        avgTourCostPromise,
        totalTourByDivisionPromise,
        totalHighestBookedTourPromise
    ])

    return {
        totalTour,
        totalTourByTourType,
        avgTourCost,
        totalTourByDivision,
        totalHighestBookedTour
    }
}


const getBookingStats = async () => {

    return {}
}

const getPaymentStats = async () => {


    return {}
}






export const StatsService = {
    getBookingStats,
    getPaymentStats,
    getTourStats,
    getUserStats
}
```
- added up to user and tour stats

## 33-11 Creating Dashboard Analytics API, Booking Stats

- stats.service.ts 

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Booking } from "../booking/booking.model";
import { Tour } from "../tour/tour.model";
import { IsActive } from "../user/user.interface";
import { User } from "../user/user.model";



const now = new Date();
const sevenDaysAgo = new Date(now).setDate(now.getDate() - 7);
const thirtyDaysAgo = new Date(now).setDate(now.getDate() - 30);

const getUserStats = async () => {
    const totalUsersPromise = User.countDocuments()

    const totalActiveUsersPromise = User.countDocuments({ isActive: IsActive.ACTIVE })
    const totalInActiveUsersPromise = User.countDocuments({ isActive: IsActive.INACTIVE })
    const totalBlockedUsersPromise = User.countDocuments({ isActive: IsActive.BLOCKED })

    const newUsersInLast7DaysPromise = User.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
    })
    const newUsersInLast30DaysPromise = User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
    })

    const usersByRolePromise = User.aggregate([
        // stage-1  :  Grouping users by role and count total users in each role
        {
            $group: {
                _id: "$role",
                count: { $sum: 1 }
            }
        }
    ])

    const [totalUsers, totalActiveUsers, totalInActiveUsers, totalBlockedUsers, newUsersInLast7Days, newUsersInLast30Days, usersByRole] = await Promise.all([
        totalUsersPromise,
        totalActiveUsersPromise,
        totalInActiveUsersPromise,
        totalBlockedUsersPromise,
        newUsersInLast7DaysPromise,
        newUsersInLast30DaysPromise,
        usersByRolePromise
    ])
    return {
        totalUsers,
        totalActiveUsers,
        totalInActiveUsers,
        totalBlockedUsers,
        newUsersInLast7Days,
        newUsersInLast30Days,
        usersByRole
    }

}

const getTourStats = async () => {


    /**
 * await Tour.updateMany(
        {
            // Only update where tourType or division is stored as a string
            $or: [
                { tourType: { $type: "string" } },
                { division: { $type: "string" } }
            ]
        },
        [
            {
                $set: {
                    tourType: { $toObjectId: "$tourType" },
                    division: { $toObjectId: "$division" }
                }
            }
        ]
    );
 */
    const totalTourPromise = Tour.countDocuments();

    const totalTourByTourTypePromise = Tour.aggregate([
        // stage-1 : connect Tour Type model - lookup stage
        {
            $lookup: {
                from: "tourtypes",
                localField: "tourType",
                foreignField: "_id",
                as: "type"
            }
        },
        // this will give us array of types so we have to do unwind 
        //stage - 2 : unwind the array to object

        {
            $unwind: "$type"
        },

        //stage - 3 : grouping tour type
        {
            $group: {
                _id: "$type.name",
                count: { $sum: 1 }
            }
        }
    ])

    const avgTourCostPromise = Tour.aggregate([
        //Stage-1 : group the cost from, do sum, and average the sum
        {
            $group: {
                _id: null,
                avgCostFrom: { $avg: "$costFrom" }
            }
        }
    ])

    const totalTourByDivisionPromise = Tour.aggregate([
        // stage-1 : connect Division model - lookup stage
        {
            $lookup: {
                from: "divisions",
                localField: "division",
                foreignField: "_id",
                as: "division"
            }
        },
        //stage - 2 : unwind the array to object

        {
            $unwind: "$division"
        },

        //stage - 3 : grouping tour type
        {
            $group: {
                _id: "$division.name",
                count: { $sum: 1 }
            }
        }
    ])

    const totalHighestBookedTourPromise = Booking.aggregate([
        // stage-1 : Group the tour
        {
            $group: {
                _id: "$tour",
                bookingCount: { $sum: 1 }
            }
        },

        //stage-2 : sort the tour

        {
            $sort: { bookingCount: -1 }
        },

        //stage-3 : sort
        {
            $limit: 5
        },

        //stage-4 lookup stage
        {
            $lookup: {
                from: "tours",
                let: { tourId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$_id", "$$tourId"] }  //tour collection _id booking collection tourId
                        }
                    }
                ],
                as: "tour"
            }
        },
        //stage-5 unwind stage
        { $unwind: "$tour" },

        //stage-6 Project stage

        {
            $project: {
                bookingCount: 1,
                "tour.title": 1,
                "tour.slug": 1
            }
        }
    ])

    const [totalTour, totalTourByTourType, avgTourCost, totalTourByDivision, totalHighestBookedTour] = await Promise.all([
        totalTourPromise,
        totalTourByTourTypePromise,
        avgTourCostPromise,
        totalTourByDivisionPromise,
        totalHighestBookedTourPromise
    ])

    return {
        totalTour,
        totalTourByTourType,
        avgTourCost,
        totalTourByDivision,
        totalHighestBookedTour
    }
}


const getBookingStats = async () => {

    const totalBookingPromise = Booking.countDocuments()

    const totalBookingByStatusPromise = Booking.aggregate([
        //stage-1 group stage
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 }
            }
        }
    ])

    const bookingsPerTourPromise = Booking.aggregate([
        //stage1 group stage

        {
            $group: {
                _id: "$tour",
                bookingCount: { $sum: 1 }
            }
        },

        //stage-2 sort stage
        {
            $sort: { bookingCount: -1 }
        },

        //stage-3 limit stage
        {
            $limit: 10
        },

        //stage-4 lookup stage
        {
            $lookup: {
                from: "tours",
                localField: "_id",
                foreignField: "_id",
                as: "tour"
            }
        },

        // stage5 - unwind stage
        {
            $unwind: "$tour"
        },

        // stage6 project stage

        {
            $project: {
                bookingCount: 1,
                _id: 1,
                "tour.title": 1,
                "tour.slug": 1
            }
        }
    ])

    const avgGuestCountPerBookingPromise = Booking.aggregate([
        // stage 1  - group stage
        {
            $group: {
                _id: null,
                avgGuestCount: { $avg: "$guestCount" }
            }
        }
    ])

    const bookingsLast7DaysPromise = Booking.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
    })
    const bookingsLast30DaysPromise = Booking.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
    })

    const totalBookingByUniqueUsersPromise = Booking.distinct("user").then((user: any) => user.length)

    const [totalBooking, totalBookingByStatus, bookingsPerTour, avgGuestCountPerBooking, bookingsLast7Days, bookingsLast30Days, totalBookingByUniqueUsers] = await Promise.all([
        totalBookingPromise,
        totalBookingByStatusPromise,
        bookingsPerTourPromise,
        avgGuestCountPerBookingPromise,
        bookingsLast7DaysPromise,
        bookingsLast30DaysPromise,
        totalBookingByStatusPromise,
        totalBookingByUniqueUsersPromise
    ])

    return { totalBooking, totalBookingByStatus, bookingsPerTour, avgGuestCountPerBooking: avgGuestCountPerBooking[0].avgGuestCount, bookingsLast7Days, bookingsLast30Days, totalBookingByUniqueUsers }
}


const getPaymentStats = async () => {


    return {}
}
export const StatsService = {
    getBookingStats,
    getPaymentStats,
    getTourStats,
    getUserStats
}
```

## 33-12 Creating Dashboard Analytics API, Payment Stats

- stats.service.ts

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Booking } from "../booking/booking.model";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { Payment } from "../payment/payment.model";
import { Tour } from "../tour/tour.model";
import { IsActive } from "../user/user.interface";
import { User } from "../user/user.model";



const now = new Date();
const sevenDaysAgo = new Date(now).setDate(now.getDate() - 7);
const thirtyDaysAgo = new Date(now).setDate(now.getDate() - 30);

const getUserStats = async () => {
    const totalUsersPromise = User.countDocuments()

    const totalActiveUsersPromise = User.countDocuments({ isActive: IsActive.ACTIVE })
    const totalInActiveUsersPromise = User.countDocuments({ isActive: IsActive.INACTIVE })
    const totalBlockedUsersPromise = User.countDocuments({ isActive: IsActive.BLOCKED })

    const newUsersInLast7DaysPromise = User.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
    })
    const newUsersInLast30DaysPromise = User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
    })

    const usersByRolePromise = User.aggregate([
        // stage-1  :  Grouping users by role and count total users in each role
        {
            $group: {
                _id: "$role",
                count: { $sum: 1 }
            }
        }
    ])

    const [totalUsers, totalActiveUsers, totalInActiveUsers, totalBlockedUsers, newUsersInLast7Days, newUsersInLast30Days, usersByRole] = await Promise.all([
        totalUsersPromise,
        totalActiveUsersPromise,
        totalInActiveUsersPromise,
        totalBlockedUsersPromise,
        newUsersInLast7DaysPromise,
        newUsersInLast30DaysPromise,
        usersByRolePromise
    ])
    return {
        totalUsers,
        totalActiveUsers,
        totalInActiveUsers,
        totalBlockedUsers,
        newUsersInLast7Days,
        newUsersInLast30Days,
        usersByRole
    }

}

const getTourStats = async () => {


    /**
 * await Tour.updateMany(
        {
            // Only update where tourType or division is stored as a string
            $or: [
                { tourType: { $type: "string" } },
                { division: { $type: "string" } }
            ]
        },
        [
            {
                $set: {
                    tourType: { $toObjectId: "$tourType" },
                    division: { $toObjectId: "$division" }
                }
            }
        ]
    );
 */
    const totalTourPromise = Tour.countDocuments();

    const totalTourByTourTypePromise = Tour.aggregate([
        // stage-1 : connect Tour Type model - lookup stage
        {
            $lookup: {
                from: "tourtypes",
                localField: "tourType",
                foreignField: "_id",
                as: "type"
            }
        },
        // this will give us array of types so we have to do unwind 
        //stage - 2 : unwind the array to object

        {
            $unwind: "$type"
        },

        //stage - 3 : grouping tour type
        {
            $group: {
                _id: "$type.name",
                count: { $sum: 1 }
            }
        }
    ])

    const avgTourCostPromise = Tour.aggregate([
        //Stage-1 : group the cost from, do sum, and average the sum
        {
            $group: {
                _id: null,
                avgCostFrom: { $avg: "$costFrom" }
            }
        }
    ])

    const totalTourByDivisionPromise = Tour.aggregate([
        // stage-1 : connect Division model - lookup stage
        {
            $lookup: {
                from: "divisions",
                localField: "division",
                foreignField: "_id",
                as: "division"
            }
        },
        //stage - 2 : unwind the array to object

        {
            $unwind: "$division"
        },

        //stage - 3 : grouping tour type
        {
            $group: {
                _id: "$division.name",
                count: { $sum: 1 }
            }
        }
    ])

    const totalHighestBookedTourPromise = Booking.aggregate([
        // stage-1 : Group the tour
        {
            $group: {
                _id: "$tour",
                bookingCount: { $sum: 1 }
            }
        },

        //stage-2 : sort the tour

        {
            $sort: { bookingCount: -1 }
        },

        //stage-3 : sort
        {
            $limit: 5
        },

        //stage-4 lookup stage
        {
            $lookup: {
                from: "tours",
                let: { tourId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$_id", "$$tourId"] }  //tour collection _id booking collection tourId
                        }
                    }
                ],
                as: "tour"
            }
        },
        //stage-5 unwind stage
        { $unwind: "$tour" },

        //stage-6 Project stage

        {
            $project: {
                bookingCount: 1,
                "tour.title": 1,
                "tour.slug": 1
            }
        }
    ])

    const [totalTour, totalTourByTourType, avgTourCost, totalTourByDivision, totalHighestBookedTour] = await Promise.all([
        totalTourPromise,
        totalTourByTourTypePromise,
        avgTourCostPromise,
        totalTourByDivisionPromise,
        totalHighestBookedTourPromise
    ])

    return {
        totalTour,
        totalTourByTourType,
        avgTourCost,
        totalTourByDivision,
        totalHighestBookedTour
    }
}


const getBookingStats = async () => {

    const totalBookingPromise = Booking.countDocuments()

    const totalBookingByStatusPromise = Booking.aggregate([
        //stage-1 group stage
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 }
            }
        }
    ])

    const bookingsPerTourPromise = Booking.aggregate([
        //stage1 group stage

        {
            $group: {
                _id: "$tour",
                bookingCount: { $sum: 1 }
            }
        },

        //stage-2 sort stage
        {
            $sort: { bookingCount: -1 }
        },

        //stage-3 limit stage
        {
            $limit: 10
        },

        //stage-4 lookup stage
        {
            $lookup: {
                from: "tours",
                localField: "_id",
                foreignField: "_id",
                as: "tour"
            }
        },

        // stage5 - unwind stage
        {
            $unwind: "$tour"
        },

        // stage6 project stage

        {
            $project: {
                bookingCount: 1,
                _id: 1,
                "tour.title": 1,
                "tour.slug": 1
            }
        }
    ])

    const avgGuestCountPerBookingPromise = Booking.aggregate([
        // stage 1  - group stage
        {
            $group: {
                _id: null,
                avgGuestCount: { $avg: "$guestCount" }
            }
        }
    ])

    const bookingsLast7DaysPromise = Booking.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
    })
    const bookingsLast30DaysPromise = Booking.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
    })

    const totalBookingByUniqueUsersPromise = Booking.distinct("user").then((user: any) => user.length)

    const [totalBooking, totalBookingByStatus, bookingsPerTour, avgGuestCountPerBooking, bookingsLast7Days, bookingsLast30Days, totalBookingByUniqueUsers] = await Promise.all([
        totalBookingPromise,
        totalBookingByStatusPromise,
        bookingsPerTourPromise,
        avgGuestCountPerBookingPromise,
        bookingsLast7DaysPromise,
        bookingsLast30DaysPromise,
        totalBookingByStatusPromise,
        totalBookingByUniqueUsersPromise
    ])

    return { totalBooking, totalBookingByStatus, bookingsPerTour, avgGuestCountPerBooking: avgGuestCountPerBooking[0].avgGuestCount, bookingsLast7Days, bookingsLast30Days, totalBookingByUniqueUsers }
}

const getPaymentStats = async () => {

    const totalPaymentPromise = Payment.countDocuments();

    const totalPaymentByStatusPromise = Payment.aggregate([
        //stage 1 group
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 }
            }
        }
    ])

    const totalRevenuePromise = Payment.aggregate([
        //stage1 match stage
        {
            $match: { status: PAYMENT_STATUS.PAID }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$amount" }
            }
        }
    ])

    const avgPaymentAmountPromise = Payment.aggregate([
        //stage 1 group stage
        {
            $group: {
                _id: null,
                avgPaymentAMount: { $avg: "$amount" }
            }
        }
    ])

    const paymentGatewayDataPromise = Payment.aggregate([
        //stage 1 group stage
        {
            $group: {
                _id: { $ifNull: ["$paymentGatewayData.status", "UNKNOWN"] },
                count: { $sum: 1 }
            }
        }
    ])



    const [totalPayment, totalPaymentByStatus, totalRevenue, avgPaymentAmount, paymentGatewayData] = await Promise.all([
        totalPaymentPromise,
        totalPaymentByStatusPromise,
        totalRevenuePromise,
        avgPaymentAmountPromise,
        paymentGatewayDataPromise

    ])
    return { totalPayment, totalPaymentByStatus, totalRevenue, avgPaymentAmount, paymentGatewayData }
}


export const StatsService = {
    getBookingStats,
    getPaymentStats,
    getTourStats,
    getUserStats
}
```

## 33-13 Validate the Payment with SSLCommerz

- we have work left over SSLCOMERZ. 
- when payment is successful it will call the IPN url we have set. which is a backend url post request and will pass us val_id and then we will give the val_id to their another post request. in response sslcomerze will give us Paymentgetway data and we will update it inside the payment collection.
- There was a problem that we can not implement this or we can not set the IPN as local host. project must be deployed.
- the flow will be like after successful payment the IPN url (post method made by us for our backend) will be automatically called and then inside the url validate payment function will be called 

- sslCommerz.service.ts 

```ts
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios"
import httpStatus from "http-status-codes"
import { envVars } from "../../config/env"
import AppError from "../../errorHelpers/AppError"
import { ISSLCommerz } from "./sslCommerz.interface"
import { Payment } from "../payment/payment.model"

const sslPaymentInit = async (payload: ISSLCommerz) => {

    try {
        const data = {
            store_id: envVars.SSL.STORE_ID,
            store_passwd: envVars.SSL.STORE_PASS,
            total_amount: payload.amount,
            currency: "BDT",
            tran_id: payload.transactionId,
            success_url: `${envVars.SSL.SSL_SUCCESS_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=success`, //takes to default post 
            fail_url: `${envVars.SSL.SSL_FAIL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=fail`, //takes to default post 
            cancel_url: `${envVars.SSL.SSL_CANCEL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=cancel`, //takes to default post 
            ipn_url: envVars.SSL.SSL_IPN_URL, // added for payment validation
            shipping_method: "N/A",
            product_name: "Tour",
            product_category: "Service",
            product_profile: "general",
            cus_name: payload.name,
            cus_email: payload.email,
            cus_add1: payload.address,
            cus_add2: "N/A",
            cus_city: "Dhaka",
            cus_state: "Dhaka",
            cus_postcode: "1000",
            cus_country: "Bangladesh",
            cus_phone: payload.phoneNumber,
            cus_fax: "01711111111",
            ship_name: "N/A",
            ship_add1: "N/A",
            ship_add2: "N/A",
            ship_city: "N/A",
            ship_state: "N/A",
            ship_postcode: 1000,
            ship_country: "N/A",
        }

        const response = await axios({
            method: "POST",
            url: envVars.SSL.SSL_PAYMENT_API,
            data: data,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        })

        return response.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.log("Payment Error Occured", error);
        throw new AppError(httpStatus.BAD_REQUEST, error.message)
    }
}


//_____________________Validate the payment function
// this function will be called in a post method backend api. 
// the flow will be like after successful payment the IPN url (post method made by us for our backend) will be automatically called and then inside the url validate payment function will be called 
const validatePayment = async (payload: any) => {
    try {
        const response = await axios({
            method: "GET",
            url: `${envVars.SSL.SSL_VALIDATION_API}?val_id=${payload.val_id}&store_id=${envVars.SSL.STORE_ID}&store_passwd=${envVars.SSL.STORE_PASS}`
        })

        console.log("sslcomeerz validate api response", response.data);

        await Payment.updateOne(
            { transactionId: payload.tran_id },
            { paymentGatewayData: response.data },
            { runValidators: true })
    } catch (error: any) {
        console.log(error);
        throw new AppError(401, `Payment Validation Error, ${error.message}`)
    }
}

export const SSLService = {
    sslPaymentInit,
    validatePayment
}
```

- There will be payment post route (will be hit by the ssl commerze). When ssl comerze will hit this post route it will give some data or parameter inside the body and using the body parameter our validate payment function will be hit 

- payment.route.ts

```ts
import express from "express";
import { PaymentController } from "./payment.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";


const router = express.Router();


router.post("/init-payment/:bookingId", PaymentController.initPayment);
router.post("/success", PaymentController.successPayment);
router.post("/fail", PaymentController.failPayment);
router.post("/cancel", PaymentController.cancelPayment);
router.get("/invoice/:paymentId", checkAuth(...Object.values(Role)), PaymentController.getInvoiceDownloadUrl);

// for ssl commerz payment validation
router.post("/validate-payment", PaymentController.validatePayment)

export const PaymentRoutes = router;
```

- payment.controller.ts 

```ts
import { Request, Response } from "express";
import { envVars } from "../../config/env";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentService } from "./payment.service";
import { SSLService } from "../sslCommerz/sslCommerz.service";

//validate the payment

const validatePayment = catchAsync(
    async (req: Request, res: Response) => {
        console.log("sslcommerz ipn url body", req.body);
        await SSLService.validatePayment(req.body)
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Payment Validated Successfully",
            data: null,
        });
    }
);

export const PaymentController = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    getInvoiceDownloadUrl,
    validatePayment
};
```

- we have directly called the SSLService so we do not need to create payment service for validating payment

## 33-14 Deploy The Backend in Vercel
- create a file in the root named vercel.json


```json
{
    "version": 2,
    "builds": [
        {
            "src": "dist/server.js",
            "use": "@vercel/node"
        }
    ],
    "routes": [
        {
            "src": "/(.*)",
            "dest": "dist/server.js"
        }
    ]
}
```

- update the package.json

```json
  "scripts": {
     "start": "node ./dist/server.js",
    "dev": "ts-node-dev --respawn --transpile-only ./src/server.ts",
    "build" : "tsc",
    "lint": "npx eslint ./src",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
```

- build the ts files to js file 

```
npm run build
```
- remember  the ejs files or other files except ts files needs to be pasted in dist folder since ts compiler ignores the files except ts files 

- install the vercel 

```
npm i -g vercel 
```

- vercel login 

```
vercel login
```

- deploy 

```
 vercel --prod
```
- if dependency error for cloudinary overwrite the install command in vercel 
- update the tsc command as installation error coming 
```js
  "scripts": {
    "start": "node ./dist/server.js",
    "dev": "ts-node-dev --respawn --transpile-only ./src/server.ts",
    "build": "npm install  --force && tsc",
    "lint": "npx eslint ./src",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
```
- update in vercel as well 

![alt text](image-6.png)

- still stuck in the problem? 

- main problem is cloudinary we will just manual tell cloudinary that you should be the expected version because multe3r-cloudinary-store do not support the installed version of cloudinary. we will just manually  insert the required version of cloudinary for that.  

- package.json 

```json
    "cloudinary": "^1.41.3",
```

- now fresh start
- delete the node modules 

```
rm -rf node_modules  
```
- install the npm 

```
npm install
```

- build the project 

```
npm run build
```
- re deploy 

```
vercel --prod
```

#### Now Time To Set The Ipn Url to ssl commerz

![alt text](image-7.png)

- change the env backend url to the deployed url 


#### Update in utils ->  setCookie.ts 

```ts
import { Response } from "express";
import { envVars } from "../config/env";
interface AuthToken {
    accessToken?: string,
    refreshToken?: string

}
export const setAuthCookie = (res: Response, tokenInfo: AuthToken) => {
    if (tokenInfo.accessToken) {
        res.cookie("accessToken", tokenInfo.accessToken,
            {
                httpOnly: true,
                secure: envVars.NODE_ENV === "production",
                // secure will be false as we were working in localhost 
                // for deployed project we will keep the secure true
                sameSite : "none", // for setting the cookie in live link frontend
            }
        )
    }
    if (tokenInfo.refreshToken) {
        res.cookie("refreshToken", tokenInfo.refreshToken,
            {
                httpOnly: true,
                secure: envVars.NODE_ENV === "production",
                // secure will be false as we were working in localhost 
                // for deployed project we will keep the secure true
                sameSite : "none", // for setting the cookie in live link frontend
            }
        )
    }
}
```

#### Update In app.ts ------ Cors 
- beside the cors we have to set a proxy 
```ts 
app.set("trust proxy", 1) // this means it will trust the external live links proxy 

app.use(cors({
    origin : envVars.FRONTEND_URL,
    credentials : true //have to use this for setting the token in cookies 
}))
```
- update google console oAuth consent Screen urls with backend url 

![alt text](image-8.png)

- here the token is not set in frontend url after google login because we have to set this from frontend because backend became live link 

- for google login we will use `window.location.href="https://ph-tour-management-backend-8.vercel.app/api/v1/auth/google"` instead of using axios because of avoiding cors error. Th reason of the cors error is google wants to hit the link manually. 
- for setting the cookie we have to hit a private route manually 

![alt text](image-9.png)