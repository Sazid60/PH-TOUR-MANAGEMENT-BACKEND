/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response, Router } from "express";
import { AuthControllers } from "./auth.controller";
import { checkAuth } from '../../middlewares/checkAuth';
import { Role } from "../user/user.interface";
import passport from "passport";

const router = Router()

router.post("/login", AuthControllers.credentialsLogin)
router.post("/refresh-token", AuthControllers.getNewAccessToken)
router.post("/logout", AuthControllers.logout)
router.post("/reset-password", checkAuth(...Object.values(Role)), AuthControllers.resetPassword)


router.get("/google", async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next)
})
// this kept get because the authentication is done by google and we have nothing to send in body 

router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), AuthControllers.googleCallbackController)

// this is for setting the cookies 
export const authRoutes = router