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
    guestCount: number,
    status: BOOKING_STATUS
}