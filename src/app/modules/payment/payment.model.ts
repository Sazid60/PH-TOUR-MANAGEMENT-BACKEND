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
            type: String
        }
    },
    {
        timestamps: false
    }
)

export const Payment = model<IPayment>("Payment", paymentSchema)