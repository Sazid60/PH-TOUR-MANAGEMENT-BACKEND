
import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { userControllers } from "./user.controller";

import { createUserZodSchema } from "./user.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "./user.interface";



const router = Router()



router.get("/all-users", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), userControllers.getAllUsers)
router.post("/register", validateRequest(createUserZodSchema), userControllers.createUser)

router.patch("/:id", checkAuth(...Object.values(Role)), userControllers.updateUser)

export const UserRoutes = router