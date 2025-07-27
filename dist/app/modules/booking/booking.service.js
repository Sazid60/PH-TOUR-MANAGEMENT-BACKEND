"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_model_1 = require("../user/user.model");
const booking_interface_1 = require("./booking.interface");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const booking_model_1 = require("./booking.model");
const payment_model_1 = require("../payment/payment.model");
const payment_interface_1 = require("../payment/payment.interface");
const tour_model_1 = require("../tour/tour.model");
const sslCommerz_service_1 = require("../sslCommerz/sslCommerz.service");
const getTransactionId_1 = require("../../utils/getTransactionId");
const createBooking = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const transactionId = (0, getTransactionId_1.getTransactionId)();
    // create a session over Booking model since all are happening over booking module 
    // 1. start session
    const session = yield booking_model_1.Booking.startSession();
    //2.  start transaction 
    session.startTransaction();
    // inside the try do all the operation and business logic 
    try {
        // 
        const user = yield user_model_1.User.findById(userId);
        if (!(user === null || user === void 0 ? void 0 : user.phone) || !(user === null || user === void 0 ? void 0 : user.address)) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Please Add Phone Number and Address In Your Profile For Booking!");
        }
        const tour = yield tour_model_1.Tour.findById(payload.tour).select("costFrom");
        if (!(tour === null || tour === void 0 ? void 0 : tour.costFrom)) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Tour Cost is Not Added!, Wait Until Cost Is Added!");
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const amount = Number(tour.costFrom) * Number(payload.guestCount);
        const booking = yield booking_model_1.Booking.create([Object.assign({ user: userId, status: booking_interface_1.BOOKING_STATUS.PENDING }, payload)], { session });
        const payment = yield payment_model_1.Payment.create([
            {
                booking: booking[0]._id,
                status: payment_interface_1.PAYMENT_STATUS.UNPAID,
                transactionId: transactionId,
                amount
            }
        ], { session });
        const updatedBooking = yield booking_model_1.Booking
            .findByIdAndUpdate(booking[0]._id, { payment: payment[0]._id }, { new: true, runValidators: true, session })
            .populate("user", "name email phone address")
            .populate("tour", "title costFrom")
            .populate("payment");
        // for sslCommerz
        //we are forcefully saying that you are not a objectId 
        // we are doing like this because these fields are coming from the populated field 
        const userAddress = (updatedBooking === null || updatedBooking === void 0 ? void 0 : updatedBooking.user).address;
        const userEmail = (updatedBooking === null || updatedBooking === void 0 ? void 0 : updatedBooking.user).email;
        const userPhoneNumber = (updatedBooking === null || updatedBooking === void 0 ? void 0 : updatedBooking.user).phone;
        const userName = (updatedBooking === null || updatedBooking === void 0 ? void 0 : updatedBooking.user).name;
        const sslPayload = {
            address: userAddress,
            email: userEmail,
            phoneNumber: userPhoneNumber,
            name: userName,
            amount: amount,
            transactionId: transactionId
        };
        // initiate the sslCommerg
        const sslPayment = yield sslCommerz_service_1.SSLService.sslPaymentInit(sslPayload);
        // After success commit the transaction and end the transaction 
        // here committing means inserting all the operation data to actual db from virtual database copy. 
        yield session.commitTransaction(); //transaction
        session.endSession();
        return {
            paymentUrl: sslPayment.GatewayPageURL,
            booking: updatedBooking
        };
    }
    catch (error) {
        // inside the catch handle the error of the session and aborting the session 
        yield session.abortTransaction();
        // throw new AppError(httpStatus.BAD_REQUEST, error) ❌❌
        throw error;
        //  here we do not need to use our custom AppError because mongoose already has the error pattern for this and our AppError Do Not know about the error. Mongoose does the works for us. 
    }
});
const getUserBookings = () => __awaiter(void 0, void 0, void 0, function* () {
    return {};
});
const getBookingById = () => __awaiter(void 0, void 0, void 0, function* () {
    return {};
});
const updateBookingStatus = () => __awaiter(void 0, void 0, void 0, function* () {
    return {};
});
const getAllBookings = () => __awaiter(void 0, void 0, void 0, function* () {
    return {};
});
exports.BookingService = {
    createBooking,
    getUserBookings,
    getBookingById,
    updateBookingStatus,
    getAllBookings,
};
