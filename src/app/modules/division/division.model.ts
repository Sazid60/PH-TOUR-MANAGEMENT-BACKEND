import { model, Schema } from "mongoose";
import { IDivision } from "./division.interface";


const divisionSchema = new Schema<IDivision>({
    name: { type: String, required: true, unique: true },
    slug: { type: String, unique: true },
    thumbnail: { type: String },
    description: { type: String }
}, {
    timestamps: true
})

// this pre hook is used for creating a division
divisionSchema.pre("save", async function (next) {
    if (this.isModified("name")) {
        const baseSlug = this.name.toLowerCase().split(" ").join("-")
        let slug = `${baseSlug}-division`

        let counter = 0;
        while (await Division.exists({ slug })) {
            slug = `${slug}-${counter++}`
        }

        this.slug = slug
    }

    next()

})

// this is for updating. this a query middleware and we will not get access to `this` because we have no access to the document directly 
// with the help of getUpdate() we will get the access of updated document
divisionSchema.pre("findOneAndUpdate", async function (next) {
    const division = this.getUpdate() as Partial<IDivision>
    if (division.name) {
        const baseSlug = division.name.toLowerCase().split(" ").join("-")
        let slug = `${baseSlug}-division`

        let counter = 0;
        while (await Division.exists({ slug })) {
            slug = `${slug}-${counter++}`
        }
        division.slug = slug
    }

    // for saving the slug we have do it manually using `setUpdate()`

    this.setUpdate(division)

    next()

})

export const Division = model<IDivision>("Division", divisionSchema)