
import express, { Request, Response } from "express"

import cors from "cors"

import { router } from "./app/routes"
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler"
import notFound from "./app/middlewares/notFound"
import cookieParser from "cookie-parser"
import passport from "passport"
import expressSession from "express-session"

import "./app/config/passport" //we have to let the app.ts know that passport.ts file exists 
import { envVars } from "./app/config/env"

const app = express()

app.use(expressSession({
    secret: envVars.EXPRESS_SESSION_SECRET,
    resave: false, // Don’t save the session again if nothing changed.
    saveUninitialized: false // Don’t create empty sessions for users who haven’t logged in yet.
}))
app.use(passport.initialize()) // This sets up Passport in your Express app.
app.use(passport.session()) // This tells Passport to use sessions to store login info (so the user stays logged in between requests).

app.use(cookieParser()) // cookie parser added
app.use(express.json())
app.use(cors())

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Welcome To Tour Management System"
    })
})

app.use("/api/v1", router)

// using the global error handler 
app.use(globalErrorHandler)

// Using not found route 
app.use(notFound)



export default app