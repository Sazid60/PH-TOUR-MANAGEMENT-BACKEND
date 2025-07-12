/* eslint-disable no-console */
import { Server } from "http"

import mongoose from "mongoose"
import app from "./app";
import { envVars } from "./app/config/env";
import { seedSuperAdmin } from "./app/utils/seedSuperAdmin";

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


