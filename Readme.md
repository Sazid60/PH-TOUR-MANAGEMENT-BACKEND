# PH-TOUR-MANAGEMENT-BACKEND-7

GitHub Link:

https://github.com/Apollo-Level2-Web-Dev/ph-tour-management-system-backend/tree/part-8


Task-2

https://docs.google.com/document/d/16wQ9di4Bq-LPQoxoezYVj46WP863PjR98lNgk1q71UI/edit?usp=sharing


Postman Collection 

https://github.com/Apollo-Level2-Web-Dev/ph-tour-management-system-backend/blob/part-8/Backend%20PH%20Tour%20Management%20APIs.postman_collection.json

(Download this JSON file and import in your postman)
#### what we will learn in this module?
- generating storing the otp using redis 
- sending the otp through email 
- using the otp verifying the email 
- generating invoice of payment 
- storing the invoice and sending the invoice using email. 
- aggregation pipeline 
- polishing works of the whole project 

## 33-1 Introduction to Redis, Setting and Configuring Redis
- In Here Redis is used to store the generated otp and sending the otp through email 
- In our project when we create a user by default its `verification` status is false. we have to build a mechanism by which we will be able to verify the email. for this we will use redis 

#### What is redis? 
- basically it is in memory database. 
- its store the data in our local machine like no-sql database. but there is a catch `Redis do not keep the data in ssd or hard drive ratcher it store in ram or memory`. for this reason it is called in memory database. 
- basically ram holds temporary data. when a app opens ram holds the data. This helps to make read write faster by holding data. 
- When the data is used the data is removed from the ram 
- OTP is a temporary password, so we will use redis to store it in ram. 
- Redis will give us a `ec2` server which is based on `AWS`. Itself it is a computer and has some ram and storage functionality. the OTP will be stored in storage/ram. If used or time expired it will be deleted from the ram. 
- Another works of redis is `caching` but this not our main focus right now. 
- Redis can be used as a database, cache, streaming engine, message broker, and more.

[Redis Docs](https://redis.io/docs/latest/develop/clients/nodejs/)

#### Lets Move to the Installation Part Of Redis 

- install redis 

```
npm install redis -f 

```
- setup the redis.config.ts 

```ts
/* eslint-disable no-console */
import { createClient } from 'redis';
import { envVars } from './env';

const redisClient = createClient({
    username: envVars.REDIS_USERNAME,
    password: envVars.REDIS_PASSWORD,
    socket: {
        host: envVars.REDIS_HOST,
        port: Number(envVars.REDIS_PORT)
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));

//     await redisClient.connect();
//     await redisClient.set('foo', 'bar');
//     const result = await redisClient.get('foo');
//     console.log(result)  // >>> bar

//  we will connect the redis inside the server 
export const connectRedis = async () => {
    //  we have not used try catch because already redis handled the error by using redisClient.on('error', err => console.log('Redis Client Error', err));
    if (!redisClient.isOpen) { // used this because if once connected there is no need to connect redis again 
        await redisClient.connect();
        console.log("Redis Connected !")
    }

    // await redisClient.set('foo', 'bar');
    // const result = await redisClient.get('foo');
    // console.log(result)  // >>> bar
}
```

- server.ts 

```ts 
/* eslint-disable no-console */
import { Server } from "http"

import mongoose from "mongoose"
import app from "./app";
import { envVars } from "./app/config/env";
import { seedSuperAdmin } from "./app/utils/seedSuperAdmin";
import { connectRedis } from "./app/config/redis.config";

let server: Server


const startServer = async () => {
    try {
        await mongoose.connect(envVars.DB_URL);
        console.log("Connected To MongoDb")
        server = app.listen(envVars.PORT, () => {
            console.log(`Server is Running On Port ${envVars.PORT}`)
        })
    } catch (error) {
        console.log(error)
    }
}

(async () => {
    await connectRedis() // redis connected 
    await startServer()
    await seedSuperAdmin()
})()

process.on("SIGTERM", (err) => {
    console.log("Signal Termination Happened...! Server Is Shutting Down !", err)
    if (server) {
        server.close(() => {
            process.exit(1)
        })
    }

    process.exit(1)

})

process.on("SIGINT", () => {
    console.log("I am manually Closing the server! Server Is Shutting Down !")

    // if express server is on and unhandled rejection happens close the express server using server.close()
    // then close the node server using process.exit(1)
    if (server) {
        server.close(() => {
            process.exit(1)
        })
    }

    process.exit(1)

})
process.on("unhandledRejection", () => {

    console.log("Unhandled Rejection Happened...! Server Is Shutting Down !")

    // if express server is on and unhandled rejection happens close the express server using server.close()
    // then close the node server using process.exit(1)
    if (server) {
        server.close(() => {
            process.exit(1)
        })
    }

    process.exit(1)

})

process.on("uncaughtException", (err) => {
    console.log("Uncaught Exception Happened...! Server Is Shutting Down !", err)

    // if express server is on and unhandled rejection happens close the express server using server.close()
    // then close the node server using process.exit(1)
    if (server) {
        server.close(() => {
            process.exit(1)
        })
    }

    process.exit(1)

})

//  test unhandled rejection

// Promise.reject(new Error("Opps! Unhandled Rejection Happened !....Forgot To Catch error ! "))


// TESTING uncaughtException
// throw new Error("Maamah I'm Uncaught exception error ")



```