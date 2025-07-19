# PH-TOUR-MANAGEMENT-BACKEND-6
GitHub Link: https://github.com/Apollo-Level2-Web-Dev/ph-tour-management-system-backend/tree/part-6

## 31-1 Create interface and model for Booking and Payment
- What we will learn In tHis Module ?
  1. Booking Module
  2. Payment Module (SSLCOMERZ)
  3. Transaction and Rollback 
  4. Image Uploading

#### Lets Understand The flow first 
- User -> Booking(pending) -> payment(unpaid) -> SSLCOMMERZ -> Booking Updat = Confirmed -> payment Update = Paid 

- booking.interface.ts 

```ts 
import { Types } from "mongoose";
export enum BOOKING_STATUS {
    PENDING = "PENDING",
    CANCEL = "CANCEL",
    FAILED = "FAILED",
    COMPLETE = "COMPLETE"
}
export interface IBooking {
    user: Types.ObjectId,
    tour: Types.ObjectId,
    payment?: Types.ObjectId,
    guestCount : number,
    status: BOOKING_STATUS
}
```

- payment.controller.ts 

```ts 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";

export enum PAYMENT_STATUS {
    PAID = "PAID",
    UNPAID = "UNPAID",
    CANCELLED = "CANCELLED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}
export interface IPayment {
    booking: Types.ObjectId,
    transactionId: string, //we will generate unique id 
    amount: number, //will be calculated using the guests number 
    paymentGatewayData?: any,
    // this is kept optional because initially we will create pending payment data and after successful payment it will be coming from sslcomerge so for this reason it will be any type 
    invoiceUrl?: string,
    // this will be coming from sslcommerge as well after successful payment 
    status: PAYMENT_STATUS
}
```
- here we can directly see the payment information inside the booking information we do not need to query for getting the payment information by searching using id. 

## 31-2 Create model for Booking and Payment

- booking.model.ts

```ts 
import { model, Schema } from "mongoose";
import { BOOKING_STATUS, IBooking } from "./booking.interface";


const bookingSchema = new Schema<IBooking>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        tour: {
            type: Schema.Types.ObjectId,
            ref: "Tour",
            required: true
        },
        payment: {
            type: Schema.Types.ObjectId,
            ref: "Payment",
            required: true
        },
        status: {
            type: String,
            enum: Object.values(BOOKING_STATUS),
            default: BOOKING_STATUS.PENDING
        },
        guestCount: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: false
    }
)

export const Booking = model<IBooking>("Booking", bookingSchema)
```

- payment.model.ts 

```ts 
import { model, Schema } from "mongoose";
import { IPayment, PAYMENT_STATUS } from "./payment.interface";



const paymentSchema = new Schema<IPayment>(
    {
        booking: {
            type: Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
            unique: true
        },
        transactionId: {
            type: String,
            required: true,
            unique: true
        },
        status: {
            type: String,
            enum: Object.values(PAYMENT_STATUS),
            default: PAYMENT_STATUS.UNPAID
        },
        amount: {
            type: Number,
            required: true
        },

        paymentGatewayData: {
            // this will be mixed as we have use any as type in interface 
            type: Schema.Types.Mixed,

        },
        invoiceUrl: {
            type : String
        }
    },
{
    timestamps: false
}
)

export const Booking = model<IPayment>("Payment", paymentSchema)
```