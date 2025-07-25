/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
import AppError from '../../errorHelpers/AppError';
import { IAuthProvider, IsActive, IUser } from "../user/user.interface"
import httpStatus from 'http-status-codes';
import { User } from "../user/user.model";
import bcrypt from "bcryptjs";
import { generateToken, verifyToken } from "../../utils/jwt";
import { envVars } from '../../config/env';
import { createNewAccessTokenWithRefreshToken, createUserToken } from "../../utils/userToken";
import { JwtPayload } from "jsonwebtoken";
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../utils/sendEmail';


// const credentialsLogin = async (payload: Partial<IUser>) => {
//     const { email, password } = payload

//     const isUserExist = await User.findOne({ email })
//     if (!isUserExist) {
//         throw new AppError(httpStatus.BAD_REQUEST, "Email Does Not Exist")
//     }

//     const isPasswordMatch = await bcrypt.compare(password as string, isUserExist.password as string)

//     if (!isPasswordMatch) {
//         throw new AppError(httpStatus.BAD_REQUEST, "Password Does Not Match")
//     }

//     // generating access token 

//     // const jwtPayload = {
//     //     userId: isUserExist._id,
//     //     email: isUserExist.email,
//     //     role: isUserExist.role
//     // }
//     // // const accessToken = jwt.sign(jwtPayload, "secret", { expiresIn: "1d" })
//     // const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)

//     // // function sign(payload: string | Buffer | object, secretOrPrivateKey: jwt.Secret | jwt.PrivateKey, options?: jwt.SignOptions): string (+4 overloads)

//     // const refreshToken = generateToken(jwtPayload, envVars.JWT_REFRESH_SECRET, envVars.JWT_REFRESH_EXPIRES)

//     // we are not sending the password in response so deleted. 

//     const userTokens = createUserToken(isUserExist)

//     const { password: pass, ...rest } = isUserExist.toObject()
//     return {
//         accessToken: userTokens.accessToken,
//         refreshToken: userTokens.refreshToken,
//         user: rest
//     }
// }


const getNewAccessToken = async (refreshToken: string) => {
    // const verifiedRefreshToken = verifyToken(refreshToken, envVars.JWT_REFRESH_SECRET) as JwtPayload
    // // we do not have to check the verified status and throw error because if not verified it automatically send error . so no need to write if else 

    // const isUserExist = await User.findOne({ email: verifiedRefreshToken.email })
    // if (!isUserExist) {
    //     throw new AppError(httpStatus.BAD_REQUEST, "User Does Not Exist")
    // }

    // if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
    //     throw new AppError(httpStatus.BAD_REQUEST, `User Is ${isUserExist.isActive}`)
    // }
    // if (isUserExist.isDeleted) {
    //     throw new AppError(httpStatus.BAD_REQUEST, "User Is Deleted")
    // }
    // // generating access token 
    // const jwtPayload = {
    //     userId: isUserExist._id,
    //     email: isUserExist.email,
    //     role: isUserExist.role
    // }
    // const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)

    // generating access token generating works will be done by this function 
    const newAccessToken = await createNewAccessTokenWithRefreshToken(refreshToken)
    return {
        accessToken: newAccessToken
    }
}


const changePassword = async (oldPassword: string, newPassword: string, decodedToken: JwtPayload) => {

    const user = await User.findById(decodedToken.userId)

    const isOldPasswordMatch = await bcrypt.compare(oldPassword, user!.password as string)
    if (!isOldPasswordMatch) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Old Password does not match");
    }

    user!.password = await bcrypt.hash(newPassword, Number(envVars.BCRYPT_SALT_ROUND))

    user!.save();

}

const setPassword = async (userId: string, plainPassword: string) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(404, "User Not Found")
        // though it will not be used because it will be checked by checkAuth(). still kept for safety 
    }

    if (user.password && user.auths.some(providerObject => providerObject.provider === "google")) {
        throw new AppError(httpStatus.BAD_REQUEST, "You have already set you password. Now you can change the password from your profile password update")
    }

    // .some() checks if at least one item in the array satisfies the given condition.
    // "Is there any object in the auths array where the provider is "google"?"

    const hashedPassword = await bcrypt.hash(
        plainPassword,
        Number(envVars.BCRYPT_SALT_ROUND)
    )

    const credentialProvider: IAuthProvider = {
        provider: "credentials",
        providerId: user.email
    }

    const auths: IAuthProvider[] = [...user.auths, credentialProvider]

    user.password = hashedPassword

    user.auths = auths

    await user.save()

}
const forgotPassword = async (email: string) => {
    const isUserExist = await User.findOne({ email })

    if (!isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Does Not Exist")
    }

    if (!isUserExist.isVerified) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is not verified")
    }

    if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, `User Is ${isUserExist.isActive}`)
    }
    if (isUserExist.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Is Deleted")
    }

    const jwtPayload = {
        userId: isUserExist._id,
        email: isUserExist.email,
        role: isUserExist.role
    }

    const resetToken = jwt.sign(jwtPayload, envVars.JWT_ACCESS_SECRET, {
        expiresIn: "10m"
    })

    const resetUILink = `${envVars.FRONTEND_URL}/reset-password?id=${isUserExist._id}&token=${resetToken}`

    sendEmail({
        to: isUserExist.email,
        subject: "Password Reset",
        templateName: "forgetPassword",
        templateData: {
            name: isUserExist.name,
            resetUILink
        }
    })


}

const resetPassword = async (payload: Record<string, any>, decodedToken: JwtPayload) => {
    if (payload.id != decodedToken.userId) {
        throw new AppError(401, "You can not reset your password")
    }

    const isUserExist = await User.findById(decodedToken.userId)
    if (!isUserExist) {
        throw new AppError(401, "User does not exist")
    }

    const hashedPassword = await bcrypt.hash(
        payload.newPassword,
        Number(envVars.BCRYPT_SALT_ROUND)
    )

    isUserExist.password = hashedPassword;

    await isUserExist.save()
}
export const AuthServices = {
    // credentialsLogin,
    getNewAccessToken,
    changePassword,
    resetPassword,
    setPassword,
    forgotPassword
}