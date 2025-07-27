"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = void 0;
const env_1 = require("../config/env");
const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
        if (env_1.envVars.NODE_ENV === "development") {
            console.log(err);
        }
        next(err);
    });
};
exports.catchAsync = catchAsync;
// steps
/**
 * catch async receives the request response function
 * returns a function and the return function receives req: Request, res: Response, next: NextFunction as function parameter and these are coming from catchAsync received function
 * As the return function just resolves promises so void return is said in type
 * Promise.resolve(fn(req, res, next)) these are coming from parameter of the return function
 * This avoids needing try/catch in every route handler and lets Express handle errors globally.
 *
 * */ 
