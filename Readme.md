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
        async (email: string, password: string, done: VerifyCallback) => {
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