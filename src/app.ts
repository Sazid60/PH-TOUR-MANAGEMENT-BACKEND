
import express, { Request, Response } from "express"

import cors from "cors"

import { router } from "./app/routes"
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler"
import notFound from "./app/middlewares/notFound"
import cookieParser from "cookie-parser"
import passport from "passport"
import expressSession from "express-session"

const app = express()
app.use(expressSession({
    secret: "Your Secret",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize()) //for passport js 
app.use(passport.session())
app.use(cookieParser()) // cookie parser added
app.use(express.json())
app.use(cors())

app.use("/api/v1", router)

// using the global error handler 
app.use(globalErrorHandler)

// Using not found route 
app.use(notFound)

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Welcome To Tour Management System"
    })
})

export default app