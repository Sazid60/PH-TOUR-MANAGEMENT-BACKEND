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