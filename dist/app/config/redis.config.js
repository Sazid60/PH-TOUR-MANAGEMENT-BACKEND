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
exports.connectRedis = exports.redisClient = void 0;
/* eslint-disable no-console */
const redis_1 = require("redis");
const env_1 = require("./env");
exports.redisClient = (0, redis_1.createClient)({
    username: env_1.envVars.REDIS_USERNAME,
    password: env_1.envVars.REDIS_PASSWORD,
    socket: {
        host: env_1.envVars.REDIS_HOST,
        port: Number(env_1.envVars.REDIS_PORT)
    }
});
exports.redisClient.on('error', err => console.log('Redis Client Error', err));
//     await redisClient.connect();
//     await redisClient.set('foo', 'bar');
//     const result = await redisClient.get('foo');
//     console.log(result)  // >>> bar
//  we will connect the redis inside the server 
const connectRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    //  we have not used try catch because already redis handled the error by using redisClient.on('error', err => console.log('Redis Client Error', err));
    if (!exports.redisClient.isOpen) { // used this because if once connected there is no need to connect redis again 
        yield exports.redisClient.connect();
        console.log("Redis Connected !");
    }
    // await redisClient.set('foo', 'bar');
    // const result = await redisClient.get('foo');
    // console.log(result)  // >>> bar
});
exports.connectRedis = connectRedis;
