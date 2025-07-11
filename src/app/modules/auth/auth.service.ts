import AppError from "../../errorHelpers/AppError"
import { IUser } from "../user/user.interface"
import httpStatus from 'http-status-codes';
import { User } from "../user/user.model";
import bcrypt from "bcryptjs";


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

    return {
        email: isUserExist.email
    }
}

export const AuthServices = {
    credentialsLogin
}