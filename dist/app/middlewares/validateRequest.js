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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const validateRequest = (zodSchema) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // console.log("Old Body", req.body)
        // req.body = JSON.parse(req.body.data) || req.body // for multer
        // more efficient 
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        req.body = yield zodSchema.parseAsync(req.body);
        // console.log("New Body", req.body)
        // here data sanitization is working. 
        // Its like if we give any unwanted fields inside body it will removed. and set the properly validated data inside body and the controller will work with it. 
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.validateRequest = validateRequest;
