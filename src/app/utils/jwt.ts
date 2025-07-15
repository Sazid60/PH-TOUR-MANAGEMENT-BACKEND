import { JwtPayload, SignOptions } from "jsonwebtoken";
import jwt from 'jsonwebtoken';

export const generateToken = (payload: JwtPayload, secret: string, expiresIn: string) => {
    const token = jwt.sign(payload, secret, { expiresIn } as SignOptions)
    // is to explicitly tell TypeScript that the object { expiresIn } should be treated as a SignOptions type, which is an interface provided by the jsonwebtoken package.
    return token
}

export const verifyToken = (token: string, secret: string) => {
    const verifyToken = jwt.verify(token, secret)
    return verifyToken
}