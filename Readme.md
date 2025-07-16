# PH-TOUR-MANAGEMENT-BACKEND-4

GitHub Link:

https://github.com/Apollo-Level2-Web-Dev/ph-tour-management-system-backend/tree/part-4

Task: https://docs.google.com/document/d/1RJwfxTWhUCest1vKmKEEc5ePO81FMXjd305IedeDudE/edit?usp=sharing

## 29-1 Configure Passport JS For Custom Authentication

- we are checking email here to ensure that the user trying to login using google has email property. and passport js ensures that and so that user data can be created or logged in

```ts 
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { envVars } from "./env";
import { User } from "../modules/user/user.model";
import { Role } from "../modules/user/user.interface";
import passport from "passport";

passport.use(
    new GoogleStrategy(
        {
            // options
            clientID: envVars.GOOGLE_CLIENT_ID,
            clientSecret: envVars.GOOGLE_CLIENT_SECRET,
            callbackURL: envVars.GOOGLE_CALLBACK_URL
        }, async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
            // verify
            try {

                const email = profile.emails?.[0].value

                // we are checking if the user is exist in cloud 
                if (!email) {
                    return done(null, false, { message: "No Email Found !" }) //its like throw new app error and passport has its own 
                }

                let user = await User.findOne({ email })

                if (!user) {
                    user = await User.create(
                        {
                            email,
                            name: profile.displayName,
                            picture: profile.photos?.[0].value,
                            role: Role.USER,
                            isVerified: true,
                            auths: [
                                {
                                    provider: "google",
                                    providerId: profile.id
                                }
                            ]
                        }
                    )
                }

                return done(null, user) // will set the user to req.user

            } catch (error) {
                console.log("Google Strategy Error", error)

                return done(error)
            }
        }
    ))



// frontend localhost:5173/login?redirect=/booking -> localhost:5000/api/v1/auth/google?redirect=/booking -> passport -> Google OAuth Consent -> gmail login -> successful -> after successful login will send to callback url localhost:5000/api/v1/auth/google/callback -> db store -> token

// Bridge == Google -> user db store -> token
//Custom -> email , password, role : USER, name... -> registration -> DB -> 1 User create
//Google -> req -> google -> successful : Jwt Token : Role , email -> DB - Store -> token - api access

// serialize the passport 

// Serializes the user (stores minimal info like user ID in the session)

passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
    done(null, user._id)
})

//Deserializes the user (retrieves the full user object from the DB based on that ID for each request)

passport.deserializeUser(async (id: string, done: any) => {
    try {
        const user = await User.findById(id);
        done(null, user)
    } catch (error) {
        console.log(error);
        done(error)
    }
})
```

- if new user coming we are creating user into db and if existing user coming we will just give token and allow direct login and giving tokens. 

#### Now lets setup passport js for normal login 
- credentials login business logic validation will be shifted to  passport js setup 

- auth.service.ts 

```ts 
const credentialsLogin = async (payload: Partial<IUser>) => {
    const { email, password } = payload

    const isUserExist = await User.findOne({ email })
    if (!isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "Email Does Not Exist")
    }

    const isPasswordMatch = await bcrypt.compare(password as string, isUserExist.password as string)

    if (!isPasswordMatch) {
        throw new AppError(httpStatus.BAD_REQUEST, "Password Does Not Match")
    }

    const userTokens = createUserToken(isUserExist)

    const { password: pass, ...rest } = isUserExist.toObject()
    return {
        accessToken: userTokens.accessToken,
        refreshToken: userTokens.refreshToken,
        user: rest
    }
}
```

- passport.ts 

- we are just handling login here and register will be done separately. 
- It will not create user automatically if user do not exists like google login because we have no data of user at this point except email and password. 
- here is a catch that google login user do not have password. we do not have password for login in here.
- we have to manage this issue by adding password field 
- we will send a message that if you logged in using google please set the password or just login using google again 

```ts 
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { envVars } from "./env";
import { User } from "../modules/user/user.model";
import { Role } from "../modules/user/user.interface";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from 'bcryptjs';


passport.use(
    new LocalStrategy(
        {
            usernameField: "email",
            passwordField: "password"
            // these will be passed to the verify function 
        },
        //  we do not need to give the done type for local as it automatically infers 
        async (email: string, password: string, done) => {
            // there will be the business logics that will hold the functionalities that we have done in credentialsLogin
            try {
                const isUserExist = await User.findOne({ email })

                // we are just handling login here and register will be done separately. 
                // It will not create user automatically if user do not exists like google login because we have no data of user at this point except email and password. 
                if (!isUserExist) {
                    return done(null, false, { message: "User Not Found" })
                }

                const isPasswordMatch = await bcrypt.compare(password as string, isUserExist.password as string)

                if (!isPasswordMatch) {
                    return done(null, false, { message: "Password Does Not Match" })
                }

                return done(null, isUserExist)

                // here is a catch that google login user do not have password. we do not have password for login in here.
                // we have to manage this issue by adding password field 
                // we will send a message that if you logged in using google please set the password or just login using google again 

            } catch (error) {
                console.log(error)
                return done(error) // this is acting like next(error)
            }
        }
    )
)

passport.use(
    new GoogleStrategy(
        {
            // options
            clientID: envVars.GOOGLE_CLIENT_ID,
            clientSecret: envVars.GOOGLE_CLIENT_SECRET,
            callbackURL: envVars.GOOGLE_CALLBACK_URL
        }, async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
            // verify
            try {

                const email = profile.emails?.[0].value

                // we are checking if the user is exist in cloud 
                if (!email) {
                    return done(null, false, { message: "No Email Found !" }) //its like throw new app error and passport has its own 
                }

                let user = await User.findOne({ email })

                if (!user) {
                    user = await User.create(
                        {
                            email,
                            name: profile.displayName,
                            picture: profile.photos?.[0].value,
                            role: Role.USER,
                            isVerified: true,
                            auths: [
                                {
                                    provider: "google",
                                    providerId: profile.id
                                }
                            ]
                        }
                    )
                }

                return done(null, user) // will set the user to req.user

            } catch (error) {
                console.log("Google Strategy Error", error)

                return done(error)
            }
        }
    ))



// frontend localhost:5173/login?redirect=/booking -> localhost:5000/api/v1/auth/google?redirect=/booking -> passport -> Google OAuth Consent -> gmail login -> successful -> after successful login will send to callback url localhost:5000/api/v1/auth/google/callback -> db store -> token

// Bridge == Google -> user db store -> token
//Custom -> email , password, role : USER, name... -> registration -> DB -> 1 User create
//Google -> req -> google -> successful : Jwt Token : Role , email -> DB - Store -> token - api access

// serialize the passport 

// Serializes the user (stores minimal info like user ID in the session)

passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
    done(null, user._id)
})

//Deserializes the user (retrieves the full user object from the DB based on that ID for each request)

passport.deserializeUser(async (id: string, done: any) => {
    try {
        const user = await User.findById(id);
        done(null, user)
    } catch (error) {
        console.log(error);
        done(error)
    }
})
```

## 29-2 Check if the user has Google Authentication, during Credential Login

- Now Lets Build a system like if user logged in using google we will send a message if he tries to login using password and email that please login using google and set the password. 
-  we do not need to give the done type for local as it automatically infers
-  Before password matching we have to check that the use is google authenticated or not. 
-  some array method is used for this. .some() is specifically designed for checking if at least one item in an array matches a condition — and it can short-circuit

- passport.ts 

```ts 
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { envVars } from "./env";
import { User } from "../modules/user/user.model";
import { Role } from "../modules/user/user.interface";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from 'bcryptjs';


passport.use(
    new LocalStrategy(
        {
            usernameField: "email",
            passwordField: "password"
            // these will be passed to the verify function 
        },
        //  we do not need to give the done type for local as it automatically infers 
        async (email: string, password: string, done) => {
            // there will be the business logics that will hold the functionalities that we have done in credentialsLogin
            try {
                const isUserExist = await User.findOne({ email })

                // we are just handling login here and register will be done separately. 
                // It will not create user automatically if user do not exists like google login because we have no data of user at this point except email and password. 
                if (!isUserExist) {
                    return done(null, false, { message: "User Not Found" })
                }

                // Returns true if any item in array matches the condition
                // .some() is specifically designed for checking if at least one item in an array matches a condition — and it can short-circuit
                const isGoogleAuthenticated = isUserExist.auths.some(providerObjects => providerObjects.provider == "google")

                if (isGoogleAuthenticated && !isUserExist.password) {
                    return done(null, false, { message: "You have authenticated through Google. So if you want to login with credentials, then at first login with google and set a password for your Gmail and then you can login with email and password." })
                }

                const isPasswordMatch = await bcrypt.compare(password as string, isUserExist.password as string)

                if (!isPasswordMatch) {
                    return done(null, false, { message: "Password Does Not Match" })
                }

                return done(null, isUserExist)

                // here is a catch that google login user do not have password. we do not have password for login in here.
                // we have to manage this issue by adding password field 
                // we will send a message that if you logged in using google please set the password or just login using google again 

            } catch (error) {
                console.log(error)
                return done(error) // this is acting like next(error)
            }
        }
    )
)

passport.use(
    new GoogleStrategy(
        {
            // options
            clientID: envVars.GOOGLE_CLIENT_ID,
            clientSecret: envVars.GOOGLE_CLIENT_SECRET,
            callbackURL: envVars.GOOGLE_CALLBACK_URL
        }, async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
            // verify
            try {

                const email = profile.emails?.[0].value

                // we are checking if the user is exist in cloud 
                if (!email) {
                    return done(null, false, { message: "No Email Found !" }) //its like throw new app error and passport has its own 
                }

                let user = await User.findOne({ email })

                if (!user) {
                    user = await User.create(
                        {
                            email,
                            name: profile.displayName,
                            picture: profile.photos?.[0].value,
                            role: Role.USER,
                            isVerified: true,
                            auths: [
                                {
                                    provider: "google",
                                    providerId: profile.id
                                }
                            ]
                        }
                    )
                }

                return done(null, user) // will set the user to req.user

            } catch (error) {
                console.log("Google Strategy Error", error)

                return done(error)
            }
        }
    ))



// frontend localhost:5173/login?redirect=/booking -> localhost:5000/api/v1/auth/google?redirect=/booking -> passport -> Google OAuth Consent -> gmail login -> successful -> after successful login will send to callback url localhost:5000/api/v1/auth/google/callback -> db store -> token

// Bridge == Google -> user db store -> token
//Custom -> email , password, role : USER, name... -> registration -> DB -> 1 User create
//Google -> req -> google -> successful : Jwt Token : Role , email -> DB - Store -> token - api access

// serialize the passport 

// Serializes the user (stores minimal info like user ID in the session)

passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
    done(null, user._id)
})

//Deserializes the user (retrieves the full user object from the DB based on that ID for each request)

passport.deserializeUser(async (id: string, done: any) => {
    try {
        const user = await User.findById(id);
        done(null, user)
    } catch (error) {
        console.log(error);
        done(error)
    }
})
```
- from now on for normal login we do not have to go to services and the login will be don by passport js

 ## 29-3 Implement Passport JS For Custom Authentication in routes and controllers
 - Now On login works will be like route -> controller -> passport (passport will authenticate and login) - works done 
 - Lets Understand The auth.route.ts routing more deeply 
- here passport is a middleware function. we are just using the function and express is calling the function ( like passport.authenticate()) of the middlewares like other middlewares we have created.

```ts 
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), AuthControllers.googleCallbackController)
```
- here is another catch. why we have called the function for this route? we have done this because we have used `const redirect = req.query.redirect || "/"` here and passport do not know about it so we have trigger the function(req,res,next) manually so that express understand this. 

```ts 
router.get("/google", async (req: Request, res: Response, next: NextFunction) => {
    const redirect = req.query.redirect || "/"
    passport.authenticate("google", { scope: ["profile", "email"], state: redirect as string })(req, res, next)
})
```
- auth.route.ts 
```ts 

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

//  /booking -> /login -> successful google login -> /booking frontend
// /login -> successful google login -> / frontend
router.get("/google", async (req: Request, res: Response, next: NextFunction) => {
    const redirect = req.query.redirect || "/"
    passport.authenticate("google", { scope: ["profile", "email"], state: redirect as string })(req, res, next)
})
// this kept get because the authentication is done by google and we have nothing to send in body 

// api/v1/auth/google/callback?state=/booking this redirect state will be added in the url by the previous auth login route
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), AuthControllers.googleCallbackController)

// this is for setting the cookies 



export const authRoutes = router
```
- this concept is the key to understand. express just call the upper function and it do call function inside the function. so if we use passport.authenticate() in other function we need to manually trigger. 
- For login system response sending cookie setting works will be done inside passport controller that will be inside the auth.controller.ts -> credentialsLogin


#### Lets understand some kicks 
- where we are getting  (err: any, user: any, info: any) in the function? 
- remember ? we have used to send response inside the passport config done(err, user, info)? this the reason why we are getting here.
- auth.controller.ts 
- as passport is middleware for passing the error we need follow some rules like passport 
-  here we can not directly call the throw new AppError(403,err) because we are inside passport js service
-  `return next(err) ` ere we were not suppose to get return next(). still we are getting because we have manually triggered the function at the end (req, res, next). but we can not just write next(err)
-  we can not use not use done() here — because you're already in the final callback of passport.authenticate, where done() has already been called internally by Passport.
  
```ts 
       passport.authenticate("local", async (err: any, user: any, info: any) => {
        // where we are getting  (err: any, user: any, info: any) in the function? 
        // remember ? we have used to send response done(err, user, info)? this the reason why we are getting here. 
        if (err) {
            return new AppError(401, err)
            // here we can not directly call the throw new AppError(403,err) because we are inside passport js service 
            // things we can do here for throwing error 
            /*
            * return next(err) 

            here we were not suppose to get return next(). still we are getting because we have manually triggered the function at the end (req, res, next). but we can not just write next(err)

            * we can not use not use done() here — because you're already in the final callback of passport.authenticate, where done() has already been called internally by Passport.

            */
        }

        if (!user) {
            // console.log("from !user");
            // return new AppError(401, info.message)
            return next(new AppError(401, info.message))
        }

        const userTokens = await createUserToken(user)

        // delete user.toObject().password

        const { password: pass, ...rest } = user.toObject()


        setAuthCookie(res, userTokens)

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "User Logged In Successfully",
            data: {
                accessToken: userTokens.accessToken,
                refreshToken: userTokens.refreshToken,
                user: rest
            }
        })
    })(req, res, next) // express just call the upper function and it do call function inside the function. so if we use passport.authenticate() in other function we need to manually trigger. 
```

- we can use done in different ways 
- like we knew `done(err, user, info)` we can just use `done("user Not Found")` as well. this will set the error message to the error. 