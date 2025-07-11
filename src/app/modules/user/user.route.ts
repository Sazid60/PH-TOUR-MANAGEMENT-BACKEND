
import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { userControllers } from "./user.controller";

import { createUserZodSchema } from "./user.validation";


const router = Router()


router.get("/all-users", userControllers.getAllUsers)
router.post("/register",
    validateRequest(createUserZodSchema),
    userControllers.createUser)

export const UserRoutes = router