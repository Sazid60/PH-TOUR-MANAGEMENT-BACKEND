

import { excludedFields } from "../../constants";
import { tourSearchableFields } from "./tour.constant";
import { ITour, ITourType } from "./tour.interface";
import { Tour, TourType } from "./tour.model";

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

const getAllTours = async (query: Record<string, unknown>) => {
    const filter = query
    const searchTerm = query.searchTerm || ""

    const sort = query.sort || "-createdAt"

    const fields = (query.fields as string).split(",").join(" ") || "";


    // console.log(sort)

    //This line deletes the searchTerm key from the filter object in JavaScript/TypeScript.
    // delete filter["searchTerm"]
    // delete filter["sort"]

    // const tourSearchableFields = ["title", "description", "location"]

    // const excludedFields = ["searchTerm", "sort"]

    for (const field of excludedFields) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete filter[field]
    }

    //  this means the fields where the searching will be happened. 
    // the mechanism will be like if not found in one search field it will search in another search field that we have mentioned here. 

    // lets make the search query dynamic 

    const searchQuery = {
        $or: tourSearchableFields.map(field => ({ [field]: { $regex: searchTerm, $options: "i" } }))
    }
    // this is giving something like 
    // { title: { $regex: searchTerms, $options: "i" } }
    // { description: { $regex: searchTerms, $options: "i" } }
    // { location: { $regex: searchTerms, $options: "i" } }

    const allTours = await Tour.find(searchQuery).find(filter).sort(sort as string).select(fields)
    const totalTours = await Tour.countDocuments();
    const meta = {
        total: totalTours,
    }
    return {
        data: allTours,
        meta: meta
    }
};



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

    const updatedTour = await Tour.findByIdAndUpdate(id, payload, { new: true });

    return updatedTour;
};

const deleteTour = async (id: string) => {
    return await Tour.findByIdAndDelete(id);
};

const createTourType = async (payload: ITourType) => {

    const existingTourType = await TourType.findOne({ name: payload.name });

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
};