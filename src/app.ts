
import express, { Request, Response } from "express"

import cors from "cors"

import { router } from "./app/routes"
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler"
import notFound from "./app/middlewares/notFound"
import cookieParser from "cookie-parser"


const app = express()

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