
import { tourSearchableFields } from "./tour.constant";
import { ITour, ITourType } from "./tour.interface";
import { Tour, TourType } from "./tour.model";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { deleteImageFromCloudinary } from "../../config/cloudinary.config";


const createTour = async (payload: ITour) => {
    const existingTour = await Tour.findOne({ title: payload.title });
    if (existingTour) {
        throw new Error("A tour with this title already exists.");
    }

    // const baseSlug = payload.title.toLowerCase().split(" ").join("-")
    // let slug = `${baseSlug}`

    // let counter = 0;
    // while (await Tour.exists({ slug })) {
    //     slug = `${slug}-${counter++}` // dhaka-division-2
    // }

    // payload.slug = slug;

    const tour = await Tour.create(payload)

    return tour;
};

// const getAllTours = async (query: Record<string, unknown>) => {
//     const filter = query
//     const searchTerm = query.searchTerm || ""

//     const sort = query.sort || "-createdAt"

//     const page = Number(query.page) || 1
//     const limit = Number(query.limit) || 10

//     const skip = (page - 1) * limit

//     const fields = (query.fields as string)?.split(",").join(" ") || "";


//     // console.log(sort)

//     //This line deletes the searchTerm key from the filter object in JavaScript/TypeScript.
//     // delete filter["searchTerm"]
//     // delete filter["sort"]

//     // const tourSearchableFields = ["title", "description", "location"]

//     // const excludedFields = ["searchTerm", "sort"]

//     for (const field of excludedFields) {
//         // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
//         delete filter[field]
//     }

//     //  this means the fields where the searching will be happened. 
//     // the mechanism will be like if not found in one search field it will search in another search field that we have mentioned here. 

//     // lets make the search query dynamic 

//     const searchObject = {
//         $or: tourSearchableFields.map(field => ({ [field]: { $regex: searchTerm, $options: "i" } }))
//     }
//     // this is giving something like 
//     // { title: { $regex: searchTerms, $options: "i" } }
//     // { description: { $regex: searchTerms, $options: "i" } }
//     // { location: { $regex: searchTerms, $options: "i" } }

//     // const allTours = await Tour.find(searchObject).find(filter).sort(sort as string).select(fields).skip(skip).limit(limit);

//     // breaking this query in smaller queries 

//     const filterQuery = Tour.find(filter)
//     const tours = filterQuery.find(searchObject)
//     const allTours = await tours.sort(sort as string).select(fields).skip(skip).limit(limit);



//     const totalTours = await Tour.countDocuments();
//     const meta = {
//         total: totalTours,
//         totalPage: Math.ceil(totalTours / limit),
//         page: page,
//         limit: limit,
//     }
//     return {
//         data: allTours,
//         meta: meta
//     }
// };
// ____________________________________________________
//query builder 

// class QueryBuilder<T> {
//     public modelQuery: Query<T[], T>;
//     public readonly query: Record<string, string>

//     constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
//         this.modelQuery = modelQuery;
//         this.query = query
//     }
//     filter(): this {
//         const filter = { ...this.query }
//         // we are not directly using the query because if directly grabbing it will modify the original  

//         for (const field of excludedFields) {
//             // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
//             delete filter[field]
//         }

//         this.modelQuery = this.modelQuery.find(filter) // Tour.find().find(filter)

//         return this;
//     }

//     search(searchableField: string[]): this {
//         const searchTerm = this.query.searchTerm || ""
//         const searchQuery = {
//             $or: searchableField.map(field => ({ [field]: { $regex: searchTerm, $options: "i" } }))
//         }
//         this.modelQuery = this.modelQuery.find(searchQuery)
//         return this
//     }
// }

// // ____________________________________________________
const getAllTours = async (query: Record<string, string>) => {
    // const filter = query
    // const searchTerm = query.searchTerm || ""

    // const sort = query.sort || "-createdAt"

    // const page = Number(query.page) || 1
    // const limit = Number(query.limit) || 10

    // const skip = (page - 1) * limit

    // const fields = (query.fields as string)?.split(",").join(" ") || "";


    // for (const field of excludedFields) {
    //     // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    //     delete filter[field]
    // }


    // const searchObject = {
    //     $or: tourSearchableFields.map(field => ({ [field]: { $regex: searchTerm, $options: "i" } }))
    // }


    // const filterQuery = Tour.find(filter) //model Query
    // const tours = filterQuery.find(searchObject)
    // const allTours = await tours.sort(sort as string).select(fields).skip(skip).limit(limit); //document

    // all works will be don e by QueryBuilder
    const queryBuilder = new QueryBuilder(Tour.find(), query)

    const tours = await queryBuilder
        .search(tourSearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate()
    // .build()

    // model query is in last because it will resolve the code. before resolve we want to do search sort filter pagination 

    // grabbing meta data from QueryBuilder method 
    // const meta = await queryBuilder.getMeta()
    const [data, meta] = await Promise.all([
        tours.build(),
        queryBuilder.getMeta()
    ])

    // const totalTours = await Tour.countDocuments();
    // const meta = {
    //     total: totalTours,
    //     totalPage: Math.ceil(totalTours / limit),
    //     page: page,
    //     limit: limit,
    // }
    return {
        data,
        meta
    }
};

const getSingleTour = async (slug: string) => {
    const tour = await Tour.findOne({ slug });
    return {
        data: tour,
    }
}



const updateTour = async (id: string, payload: Partial<ITour>) => {

    const existingTour = await Tour.findById(id);

    if (!existingTour) {
        throw new Error("Tour not found.");
    }

    // if (payload.title) {
    //     const baseSlug = payload.title.toLowerCase().split(" ").join("-")
    //     let slug = `${baseSlug}`

    //     let counter = 0;
    //     while (await Tour.exists({ slug })) {
    //         slug = `${slug}-${counter++}`
    //     }

    //     payload.slug = slug
    // }

    // ✅ If the user has uploaded new images AND there are existing images in the DB,
    // merge both sets together into payload.images.
    // This helps to temporarily keep both new and old images in the payload.

    if (payload.images && payload.images.length > 0 && existingTour.images && existingTour.images.length > 0) {
        payload.images = [...payload.images, ...existingTour.images]
        // 📝 This is combining newly added images with existing ones,
        // so we can later filter out deleted ones and finalize the image list.
    }

    // ✅ Now handle deleted images:
    // deletedImages array will be coming from frontend on the go. i mean if any existing image that user deleted will be stored in deletedImages array in frontend and will be coming inside payload 

    if (payload.deleteImages && payload.deleteImages.length > 0 && existingTour.images && existingTour.images.length > 0) {
        // 🧹 Step 1: Filter out the images that were marked for deletion from the DB list
        const restDBImages = existingTour.images.filter(imageUrl => !payload.deleteImages?.includes(imageUrl))

        // 📝 This gives us the images that still exist in the tour after deletion.

        // this is storing the images that is not existing is delete array 
        // there is a problem like user might delete images and add images at the same time. we have to grab the images that are newly added as well 

        // ➕ Step 2: Identify new images added by user
        const updatedPayloadImages = (payload.images || [])
            // Remove any that are marked for deletion (just in case)
            .filter(imageUrl => !payload.deleteImages?.includes(imageUrl))
            // Exclude existing non-deleted DB images to avoid duplication
            .filter(imageUrl => !restDBImages.includes(imageUrl))


        // Step 3: Merge the remaining DB images with the new images
        payload.images = [...restDBImages, ...updatedPayloadImages]
    }


    const updatedTour = await Tour.findByIdAndUpdate(id, payload, { new: true });

    if (payload.deleteImages && payload.deleteImages.length > 0 && existingTour.images && existingTour.images.length > 0) {
        await Promise.all(payload.deleteImages.map(url => deleteImageFromCloudinary(url)))
    }

    return updatedTour;
};

const deleteTour = async (id: string) => {
    return await Tour.findByIdAndDelete(id);
};

const createTourType = async (payload: ITourType) => {

    const existingTourType = await TourType.findOne({ name: payload });

    if (existingTourType) {
        throw new Error("Tour type already exists.");
    }

    return await TourType.create({ name: payload });
};

const getAllTourTypes = async () => {
    return await TourType.find();
};
const updateTourType = async (id: string, payload: ITourType) => {
    const existingTourType = await TourType.findById(id);
    if (!existingTourType) {
        throw new Error("Tour type not found.");
    }

    const updatedTourType = await TourType.findByIdAndUpdate(id, payload, { new: true });
    return updatedTourType;
};
const deleteTourType = async (id: string) => {
    const existingTourType = await TourType.findById(id);
    if (!existingTourType) {
        throw new Error("Tour type not found.");
    }

    return await TourType.findByIdAndDelete(id);
};

export const TourService = {
    createTour,
    createTourType,
    deleteTourType,
    updateTourType,
    getAllTourTypes,
    getAllTours,
    updateTour,
    deleteTour,
    getSingleTour
};

