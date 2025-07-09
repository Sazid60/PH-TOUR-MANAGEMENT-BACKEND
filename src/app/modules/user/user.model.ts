import { model, Schema } from "mongoose";
import { IAuthProvider, IsActive, IUser, Role } from "./user.interface";

const authProviderSchema = new Schema<IAuthProvider>({
    provider: { types: String, required: true },
    providerId: { types: String, required: true }
}, {
    versionKey: false,
    _id: false
})
const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
        type: String,
        enum: Object.values(Role),
        default: Role.USER
    },
    phone: { type: String },
    picture: { type: String },
    address: { types: String },
    isDeleted: { types: Boolean, default: false },
    isActive: {
        type: String,
        enum: Object.values(IsActive),
        default: IsActive.ACTIVE
    },
    isVerified: { types: Boolean, default: false },

    auths: [authProviderSchema]

}, {
    versionKey: false,
    timestamps: true
})


export const User = model<IUser>("User", userSchema)

