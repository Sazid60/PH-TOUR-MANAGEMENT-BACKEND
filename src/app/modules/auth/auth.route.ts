
import { NextFunction, Request, Response, Router } from "express";
import { AuthControllers } from "./auth.controller";
import { checkAuth } from '../../middlewares/checkAuth';
import { Role } from "../user/user.interface";
import passport from "passport";
import { envVars } from "../../config/env";

const router = Router()

router.post("/login", AuthControllers.credentialsLogin)
router.post("/refresh-token", AuthControllers.getNewAccessToken)
router.post("/logout", AuthControllers.logout)
router.post("/change-password", checkAuth(...Object.values(Role)), AuthControllers.changePassword)
router.post("/reset-password", checkAuth(...Object.values(Role)), AuthControllers.resetPassword)
router.post("/set-password", checkAuth(...Object.values(Role)), AuthControllers.setPassword)

//  /booking -> /login -> successful google login -> /booking frontend
// /login -> successful google login -> / frontend
router.get("/google", async (req: Request, res: Response, next: NextFunction) => {
    const redirect = req.query.redirect || "/"
    passport.authenticate("google", { scope: ["profile", "email"], state: redirect as string })(req, res, next)
})
// this kept get because the authentication is done by google and we have nothing to send in body 

// api/v1/auth/google/callback?state=/booking this redirect state will be added in the url by the previous auth login route
router.get("/google/callback", passport.authenticate("google", { failureRedirect: `${envVars.FRONTEND_URL}/login?error=There is some issues with your account. Please contact with out support team!` }), AuthControllers.googleCallbackController)

// this is for setting the cookies 



export const authRoutes = router