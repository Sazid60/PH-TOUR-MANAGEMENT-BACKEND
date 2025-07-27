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
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
const passport_google_oauth20_1 = require("passport-google-oauth20");
const env_1 = require("./env");
const user_model_1 = require("../modules/user/user.model");
const user_interface_1 = require("../modules/user/user.interface");
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
passport_1.default.use(new passport_local_1.Strategy({
    usernameField: "email",
    passwordField: "password"
    // these will be passed to the verify function 
}, 
//  we do not need to give the done type for local as it automatically infers 
(email, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    // there will be the business logics that will hold the functionalities that we have done in credentialsLogin
    try {
        const isUserExist = yield user_model_1.User.findOne({ email });
        // we are just handling login here and register will be done separately. 
        // It will not create user automatically if user do not exists like google login because we have no data of user at this point except email and password. 
        if (!isUserExist) {
            // return done(null, false, { message: "User Not Found" })
            return done("User Not Found");
        }
        if (!isUserExist.isVerified) {
            return done(`User Is Not Verified`);
        }
        if (isUserExist.isActive === user_interface_1.IsActive.BLOCKED || isUserExist.isActive === user_interface_1.IsActive.INACTIVE) {
            return done(`User Is ${isUserExist.isActive}`);
        }
        if (isUserExist.isDeleted) {
            return done(`User Is Deleted`);
        }
        // Returns true if any item in array matches the condition
        // .some() is specifically designed for checking if at least one item in an array matches a condition — and it can short-circuit
        const isGoogleAuthenticated = isUserExist.auths.some(providerObjects => providerObjects.provider == "google");
        if (isGoogleAuthenticated && !isUserExist.password) {
            return done(null, false, { message: "You have authenticated through Google. So if you want to login with credentials, then at first login with google and set a password for your Gmail and then you can login with email and password." });
        }
        const isPasswordMatch = yield bcryptjs_1.default.compare(password, isUserExist.password);
        if (!isPasswordMatch) {
            return done(null, false, { message: "Password Does Not Match" });
        }
        return done(null, isUserExist);
        // here is a catch that google login user do not have password. we do not have password for login in here.
        // we have to manage this issue by adding password field 
        // we will send a message that if you logged in using google please set the password or just login using google again 
    }
    catch (error) {
        console.log(error);
        return done(error); // this is acting like next(error)
    }
})));
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    // options
    clientID: env_1.envVars.GOOGLE_CLIENT_ID,
    clientSecret: env_1.envVars.GOOGLE_CLIENT_SECRET,
    callbackURL: env_1.envVars.GOOGLE_CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // verify
    try {
        const email = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0].value;
        // we are checking if the user is exist in cloud 
        if (!email) {
            return done(null, false, { message: "No Email Found !" }); //its like throw new app error and passport has its own 
        }
        let isUserExist = yield user_model_1.User.findOne({ email });
        if (isUserExist && !isUserExist.isVerified) {
            // throw new AppError(httpStatus.BAD_REQUEST, "User is not verified")
            // done("User is not verified")
            return done(null, false, { message: "User is not verified" });
        }
        if (isUserExist && (isUserExist.isActive === user_interface_1.IsActive.BLOCKED || isUserExist.isActive === user_interface_1.IsActive.INACTIVE)) {
            // throw new AppError(httpStatus.BAD_REQUEST, `User is ${isUserExist.isActive}`)
            done(`User is ${isUserExist.isActive}`);
        }
        if (isUserExist && isUserExist.isDeleted) {
            return done(null, false, { message: "User is deleted" });
            // done("User is deleted")
        }
        if (!isUserExist) {
            isUserExist = yield user_model_1.User.create({
                email,
                name: profile.displayName,
                picture: (_b = profile.photos) === null || _b === void 0 ? void 0 : _b[0].value,
                role: user_interface_1.Role.USER,
                isVerified: true,
                auths: [
                    {
                        provider: "google",
                        providerId: profile.id
                    }
                ]
            });
        }
        return done(null, isUserExist); // will set the user to req.user
    }
    catch (error) {
        console.log("Google Strategy Error", error);
        return done(error);
    }
})));
// frontend localhost:5173/login?redirect=/booking -> localhost:5000/api/v1/auth/google?redirect=/booking -> passport -> Google OAuth Consent -> gmail login -> successful -> after successful login will send to callback url localhost:5000/api/v1/auth/google/callback -> db store -> token
// Bridge == Google -> user db store -> token
//Custom -> email , password, role : USER, name... -> registration -> DB -> 1 User create
//Google -> req -> google -> successful : Jwt Token : Role , email -> DB - Store -> token - api access
// serialize the passport 
// Serializes the user (stores minimal info like user ID in the session)
passport_1.default.serializeUser((user, done) => {
    done(null, user._id);
});
//Deserializes the user (retrieves the full user object from the DB based on that ID for each request)
passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.User.findById(id);
        done(null, user);
    }
    catch (error) {
        console.log(error);
        done(error);
    }
}));
