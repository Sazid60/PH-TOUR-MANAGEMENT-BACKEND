import { Router } from "express";
import { userControllers } from "./user.controller";

const router = Router()


router.get("/all-users", userControllers.getAllUsers)
router.post("/register", userControllers.createUser)

export const UserRoutes = router