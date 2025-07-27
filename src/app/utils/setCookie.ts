import { Response } from "express";
import { envVars } from "../config/env";
interface AuthToken {
    accessToken?: string,
    refreshToken?: string

}
export const setAuthCookie = (res: Response, tokenInfo: AuthToken) => {
    if (tokenInfo.accessToken) {
        res.cookie("accessToken", tokenInfo.accessToken,
            {
                httpOnly: true,
                secure: envVars.NODE_ENV === "production",
                // secure will be false as we were working in localhost 
                // for deployed project we will keep the secure true
                sameSite : "none", // for setting the cookie in live link frontend
            }
        )
    }
    if (tokenInfo.refreshToken) {
        res.cookie("refreshToken", tokenInfo.refreshToken,
            {
                httpOnly: true,
                secure: envVars.NODE_ENV === "production",
                // secure will be false as we were working in localhost 
                // for deployed project we will keep the secure true
                sameSite : "none", // for setting the cookie in live link frontend
            }
        )
    }
}