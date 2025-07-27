"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
// this T will be automatically inferred from received  data 
const sendResponse = (res, data) => {
    res.status(data.statusCode).json({
        statusCode: data.statusCode,
        success: data.success,
        message: data.message,
        meta: data.meta,
        data: data.data
    });
};
exports.sendResponse = sendResponse;
