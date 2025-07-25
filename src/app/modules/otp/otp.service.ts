
import crypto from "crypto"
import { User } from "../user/user.model"
import AppError from "../../errorHelpers/AppError"
import { redisClient } from "../../config/redis.config"
import { sendEmail } from "../../utils/sendEmail"

const OTP_EXPIRATION = 2 * 60 // 2 minute 

const generateOtp = (length = 6) => {
    // 6 digit otp 
    const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString()
    // 10 ** 5 => 10 * 10 *10 *10 *10 * 10 => 1000000

    return otp
}


const sendOTP = async (email: string, name: string) => {
    const user = await User.findOne({ email })

    if (!user) {
        throw new AppError(404, "User not found")
    }

    if (user.isVerified) {
        throw new AppError(401, "You are already verified")
    }

    const otp = generateOtp();

    const redisKey = `otp${email}`



    // storing in redis 

    // await redisClient.set(Key, value,options)
    await redisClient.set(redisKey, otp, {
        expiration: {
            type: "EX", // this is for telling the time type milisec or sec or any  
            value: OTP_EXPIRATION
        }
    })

    //  now send the otp in email 

    await sendEmail({
        to: email,
        subject: "Your OTP Code",
        templateName: "otp",
        templateData: {
            name: name,
            otp: otp
        }
    })


};

const verifyOTP = async () => {
    // 

    return {}

};

export const OTPService = {
    sendOTP,
    verifyOTP
}