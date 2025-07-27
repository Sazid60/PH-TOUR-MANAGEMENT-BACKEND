/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { envVars } from "./env";
import { User } from "../modules/user/user.model";
import { IsActive, Role } from "../modules/user/user.interface";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcryptjs from 'bcryptjs';





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
                    // return done(null, false, { message: "User Not Found" })
                    return done("User Not Found")
                }

                if (!isUserExist.isVerified) {
                    return done(`User Is Not Verified`)
                }


                if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
                    return done(`User Is ${isUserExist.isActive}`)
                }
                if (isUserExist.isDeleted) {
                    return done(`User Is Deleted`)
                }

                // Returns true if any item in array matches the condition
                // .some() is specifically designed for checking if at least one item in an array matches a condition — and it can short-circuit
                const isGoogleAuthenticated = isUserExist.auths.some(providerObjects => providerObjects.provider == "google")

                if (isGoogleAuthenticated && !isUserExist.password) {
                    return done(null, false, { message: "You have authenticated through Google. So if you want to login with credentials, then at first login with google and set a password for your Gmail and then you can login with email and password." })
                }

                const isPasswordMatch = await bcryptjs.compare(password as string, isUserExist.password as string)

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

                let isUserExist = await User.findOne({ email })
                if (isUserExist && !isUserExist.isVerified) {
                    // throw new AppError(httpStatus.BAD_REQUEST, "User is not verified")
                    // done("User is not verified")
                    return done(null, false, { message: "User is not verified" })
                }

                if (isUserExist && (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE)) {
                    // throw new AppError(httpStatus.BAD_REQUEST, `User is ${isUserExist.isActive}`)
                    done(`User is ${isUserExist.isActive}`)
                }

                if (isUserExist && isUserExist.isDeleted) {
                    return done(null, false, { message: "User is deleted" })
                    // done("User is deleted")
                }

                if (!isUserExist) {
                    isUserExist = await User.create(
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

                return done(null, isUserExist) // will set the user to req.user

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