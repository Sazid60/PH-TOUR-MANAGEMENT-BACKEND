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
exports.checkAuth = void 0;
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const jwt_1 = require("../utils/jwt");
const env_1 = require("../config/env");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const user_interface_1 = require("../modules/user/user.interface");
const user_model_1 = require("../modules/user/user.model");
// ["ADMIN", "SUER_ADMIN"]
// this is receiving all the role sent (converted into an array of the sent roles) from where the middleware has been called 
const checkAuth = (...authRoles) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // we will get the access token from frontend inside headers. for now we will set in postman headers 
        const accessToken = req.headers.authorization;
        if (!accessToken) {
            throw new AppError_1.default(403, "No Token Received");
        }
        //  if there is token we will verify 
        // const verifiedToken = jwt.verify(accessToken, "secret")
        const verifiedToken = (0, jwt_1.verifyToken)(accessToken, env_1.envVars.JWT_ACCESS_SECRET);
        // console.log(verifiedToken)
        // function verify(token: string, secretOrPublicKey: jwt.Secret | jwt.PublicKey, options?: jwt.VerifyOptions & {complete?: false;}): jwt.JwtPayload | string (+6 overloads)
        const isUserExist = yield user_model_1.User.findOne({ email: verifiedToken.email });
        if (!isUserExist) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User Does Not Exist");
        }
        if (!isUserExist.isVerified) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User is not verified");
        }
        if (isUserExist.isActive === user_interface_1.IsActive.BLOCKED || isUserExist.isActive === user_interface_1.IsActive.INACTIVE) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `User Is ${isUserExist.isActive}`);
        }
        if (isUserExist.isDeleted) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User Is Deleted");
        }
        // authRoles = ["ADMIN", "SUPER_ADMIN"]
        if (!authRoles.includes(verifiedToken.role)) {
            throw new AppError_1.default(403, "You Are Not Permitted To View This Route ");
        }
        /*
        const accessToken: string | undefined
        token returns string(if any error occurs during verifying token) or a JwtPayload(same as any type that payload can be anything).
        */
        // we will make the verified token to go outside
        // req has its own method like we can get req.bdy, req.params. req.query, req.headers. but we will not get req.user for this we need custom package. of user. 
        req.user = verifiedToken;
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.checkAuth = checkAuth;
