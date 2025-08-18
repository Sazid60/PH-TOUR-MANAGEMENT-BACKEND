//query builder 

import { Query } from "mongoose";
import { excludedFields } from "../constants";

export class QueryBuilder<T> {
    public modelQuery: Query<T[], T>;
// Query<TResult, TDoc> represents a query that will eventually return TResult documents from the database, which are of type TDoc.
// So here:
// T[] → The query will return an array of documents of type T.
// T → The query is working with a model of type T.

    public readonly query: Record<string, string>

    constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
        this.modelQuery = modelQuery;
        this.query = query
    }
    filter(): this {
        const filter = { ...this.query }
        // we are not directly using the query because if directly grabbing it will modify the original  

        for (const field of excludedFields) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete filter[field]
        }

        this.modelQuery = this.modelQuery.find(filter) // Tour.find().find(filter)

        return this;
    }

    search(searchableField: string[]): this {
        const searchTerm = this.query.searchTerm || ""
        const searchQuery = {
            $or: searchableField.map(field => ({ [field]: { $regex: searchTerm, $options: "i" } }))
        }
        this.modelQuery = this.modelQuery.find(searchQuery)
        return this
    }

    sort(): this {

        const sort = this.query.sort || "-createdAt";

        this.modelQuery = this.modelQuery.sort(sort)

        return this;
    }
    fields(): this {

        const fields = this.query.fields?.split(",").join(" ") || ""

        this.modelQuery = this.modelQuery.select(fields)

        return this;
    }
    paginate(): this {

        const page = Number(this.query.page) || 1
        const limit = Number(this.query.limit) || 10
        const skip = (page - 1) * limit

        this.modelQuery = this.modelQuery.skip(skip).limit(limit)

        return this;
    }
    build() {
        return this.modelQuery
    }

    // here async was given first because in method this is the procedure
    async getMeta() {
        // const totalDocuments = await this.modelQuery.countDocuments()
        // for parallel data fetching purpose we can not call the queryBuilder again, 
        // rather we will call the existing model inside the queryBuilder and do the counting 

        const totalDocuments = await this.modelQuery.model.countDocuments()

        const page = Number(this.query.page) || 1
        const limit = Number(this.query.limit) || 10

        const totalPage = Math.ceil(totalDocuments / limit)

        return { page, limit, total: totalDocuments, totalPage }
    }

}

