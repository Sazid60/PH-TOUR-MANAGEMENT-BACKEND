"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = require("./app/routes");
const globalErrorHandler_1 = require("./app/middlewares/globalErrorHandler");
const notFound_1 = __importDefault(require("./app/middlewares/notFound"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
require("./app/config/passport"); //we have to let the app.ts know that passport.ts file exists 
const env_1 = require("./app/config/env");
const app = (0, express_1.default)();
app.use((0, express_session_1.default)({
    secret: env_1.envVars.EXPRESS_SESSION_SECRET,
    resave: false, // Don’t save the session again if nothing changed.
    saveUninitialized: false // Don’t create empty sessions for users who haven’t logged in yet.
}));
app.use(passport_1.default.initialize()); // This sets up Passport in your Express app.
app.use(passport_1.default.session()); // This tells Passport to use sessions to store login info (so the user stays logged in between requests).
app.use((0, cookie_parser_1.default)()); // cookie parser added
app.use(express_1.default.json());
app.set("trust proxy", 1); // this means it will trust the external live links proxy 
app.use(express_1.default.urlencoded({ extended: true })); // for multer upload
// 
app.use((0, cors_1.default)({
    origin: env_1.envVars.FRONTEND_URL,
    credentials: true //have to use this for setting the token in cookies 
}));
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Welcome To Tour Management System"
    });
});
app.use("/api/v1", routes_1.router);
// using the global error handler 
app.use(globalErrorHandler_1.globalErrorHandler);
// Using not found route 
app.use(notFound_1.default);
exports.default = app;
