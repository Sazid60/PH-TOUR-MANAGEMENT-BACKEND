# PH-TOUR-MANAGEMENT-BACKEND-5

## 30-1 Create Slug during create and update of Division and Tour
- see division, tour module all functionality is created. 

#### Lets Understand The Slug Mechanism. 

- division.service.ts 

```ts 
const createDivision = async (payload: IDivision) => {

    const existingDivision = await Division.findOne({ name: payload.name });
    if (existingDivision) {
        throw new Error("A division with this name already exists.");
    }


    const baseSlug = payload.name.toLowerCase().split(" ").join("-")
    let slug = `${baseSlug}-division`

    let counter = 0;
    while (await Division.exists({ slug })) {
        slug = `${slug}-${counter++}` // dhaka-division-2
    }

    payload.slug = slug;

    const division = await Division.create(payload);

    return division
};

const updateDivision = async (id: string, payload: Partial<IDivision>) => {

    const existingDivision = await Division.findById(id);
    if (!existingDivision) {
        throw new Error("Division not found.");
    }

    const duplicateDivision = await Division.findOne({
        name: payload.name,
        _id: { $ne: id },
    });

    if (duplicateDivision) {
        throw new Error("A division with this name already exists.");
    }

    if (payload.name) {
        const baseSlug = payload.name.toLowerCase().split(" ").join("-")
        let slug = `${baseSlug}-division`

        let counter = 0;
        while (await Division.exists({ slug })) {
            slug = `${slug}-${counter++}` // dhaka-division-2
        }

        payload.slug = slug
    }

    const updatedDivision = await Division.findByIdAndUpdate(id, payload, { new: true, runValidators: true })

    return updatedDivision

};
```

- tour.service.ts 

```ts 
const createTour = async (payload: ITour) => {
    const existingTour = await Tour.findOne({ title: payload.title });
    if (existingTour) {
        throw new Error("A tour with this title already exists.");
    }

    const baseSlug = payload.title.toLowerCase().split(" ").join("-")
    let slug = `${baseSlug}`

    let counter = 0;
    while (await Tour.exists({ slug })) {
        slug = `${slug}-${counter++}` // dhaka-division-2
    }

    payload.slug = slug;

    const tour = await Tour.create(payload)

    return tour;
};

const updateTour = async (id: string, payload: Partial<ITour>) => {

    const existingTour = await Tour.findById(id);

    if (!existingTour) {
        throw new Error("Tour not found.");
    }

    if (payload.title) {
        const baseSlug = payload.title.toLowerCase().split(" ").join("-")
        let slug = `${baseSlug}`

        let counter = 0;
        while (await Tour.exists({ slug })) {
            slug = `${slug}-${counter++}`
        }

        payload.slug = slug
    }

    const updatedTour = await Tour.findByIdAndUpdate(id, payload, { new: true });

    return updatedTour;
};
```

## 30-2 Create pre hooks for dynamic slug creating for Division and Tour

- division.model.ts

```ts 
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
```

- tour.model.ts 

```ts 
// this pre hook is used for creating a tour
tourSchema.pre("save", async function (next) {
    if (this.isModified("name")) {
        const baseSlug = this.title.toLowerCase().split(" ").join("-")
        let slug = `${baseSlug}`

        let counter = 0;
        while (await Tour.exists({ slug })) {
            slug = `${slug}-${counter++}`
        }

        this.slug = slug
    }

    next()

})

// this is for updating. this a query middleware and we will not get access to `this` because we have no access to the document directly 
// with the help of getUpdate() we will get the access of updated document
tourSchema.pre("findOneAndUpdate", async function (next) {
    const tour = this.getUpdate() as Partial<ITour>
    if (tour.title) {
        const baseSlug = tour.title.toLowerCase().split(" ").join("-")
        let slug = `${baseSlug}`

        let counter = 0;
        while (await Tour.exists({ slug })) {
            slug = `${slug}-${counter++}`
        }
        tour.slug = slug
    }

    // for saving the slug we have do it manually using `setUpdate()`

    this.setUpdate(tour)

    next()

})
```

## 30-3 How to do raw filtering
- filtering the data based on the query 
- route to hit 
```
http://localhost:5000/api/v1/tours?location=Khulna
```
- tour.controller.ts 

```ts 
const getAllTours = catchAsync(async (req: Request, res: Response) => {
    const query = req.query
    const result = await TourService.getAllTours(query);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Tours retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
});
```

- tour.service.ts 

```ts 
const getAllTours = async (query: Record<string, unknown>) => {
    const filter = query
    const allTours = await Tour.find(filter)
    const totalTours = await Tour.countDocuments();
    const meta = {
        total: totalTours,
    }
    return {
        data: allTours,
        meta: meta
    }
};
``` 

- lets understand a thing we are sending a query object but we do not know what is the type of the object or what will be the type of the object so, here we have to use record string. 

## 30-4 How to do raw searching
#### Filter 
- Filter is exact match. This means the filed we are targeting must have to be exactly matched. 
- suppose we want to search in location field and sent to query

```
http://localhost:5000/api/v1/tours?location=Khulna
```

- we will receive this using `req.query`. In response we will get 

```
{location : "Khulna"}
```
- In Here we have to match exactly `Khulna`. no partial match is accepted here 


#### Search 
- Searching is done partial match like we search one word and it will give us the one word matching data. 
- for grabbing the search data we have to use `searchTem`.
- we have to hit 

```
http://localhost:5000/api/v1/tours?searchTerm=Khulna
```
- we have to grab it using `query.searchTem`

- for partial match we will use `regex`

- tour.service.ts 

```ts 
const getAllTours = async (query: Record<string, unknown>) => {
    const filter = query
    const searchTerms = query.searchTerm || ""
    const tourSearchableFields = ["title", "description", "location"]
    //  this means the fields where the searching will be happened. 
    // the mechanism will be like if not found in one search field it will search in another search field that we have mentioned here. 

    // lets make the search query dynamic 

    const searchQuery = {
        $or: tourSearchableFields.map(field => ({ [field]: { $regex: searchTerms, $options: "i" } }))
    }
    // this is giving something like 
    // { title: { $regex: searchTerms, $options: "i" } }
    // { description: { $regex: searchTerms, $options: "i" } }
    // { location: { $regex: searchTerms, $options: "i" } }

    const allTours = await Tour.find(searchQuery)
    const totalTours = await Tour.countDocuments();
    const meta = {
        total: totalTours,
    }
    return {
        data: allTours,
        meta: meta
    }
};
```

- lets make it more scalable
- tour.constant.ts 

```ts 
export const tourSearchableFields = ["title", "description", "location"]

```

- tour.service.ts 

```ts
const getAllTours = async (query: Record<string, unknown>) => {
    const filter = query
    const searchTerm = query.searchTerm || ""

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

    const allTours = await Tour.find(searchQuery)
    const totalTours = await Tour.countDocuments();
    const meta = {
        total: totalTours,
    }
    return {
        data: allTours,
        meta: meta
    }
};
```

- now we want to do search and filter both 

- for this we have to understand a concept 
- searchTerm is trying to match partially and filter is trying to match exactly.
- if we hit this 

```
http://localhost:5000/api/v1/tours?location=Khulna&searchTerm=Sa
```
- we will get 

```
{location : "Khulna", searchTerm :"sa"}
```
- clash is happening here. searchTerm is trying to match partially and filter is trying to match exactly.
- we have to remove the searchTerm From the query for filter purpose and we will do multi layer find 


```ts 
const getAllTours = async (query: Record<string, unknown>) => {
    const filter = query
    const searchTerm = query.searchTerm || ""

    //This line deletes the searchTerm key from the filter object in JavaScript/TypeScript.
    delete filter["searchTerm"]

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

    const allTours = await Tour.find(searchQuery).find(filter)
    const totalTours = await Tour.countDocuments();
    const meta = {
        total: totalTours,
    }
    return {
        data: allTours,
        meta: meta
    }
};

```

## 30-5 How to do sorting ,field limiting

#### Sorting 
- sorting in ascending or descending order 
- we have to hit 

```
http://localhost:5000/api/v1/tours?sort=location
```
```
http://localhost:5000/api/v1/tours?sort=-location
```

- we have to delete the `sort` from filter as well 


```ts 
const getAllTours = async (query: Record<string, unknown>) => {
    const filter = query
    const searchTerm = query.searchTerm || ""

    const sort = query.sort || "-createdAt"

    console.log(sort)

    //This line deletes the searchTerm key from the filter object in JavaScript/TypeScript.
    delete filter["searchTerm"]
    delete filter["sort"]

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

    const allTours = await Tour.find(searchQuery).find(filter).sort(sort)
    const totalTours = await Tour.countDocuments();
    const meta = {
        total: totalTours,
    }
    return {
        data: allTours,
        meta: meta
    }
};

```
- lets make the deleting query Fields for filter in more dynamic way 

```ts
const getAllTours = async (query: Record<string, unknown>) => {
    const filter = query
    const searchTerm = query.searchTerm || ""

    const sort = query.sort || "-createdAt"

    // console.log(sort)

    //This line deletes the searchTerm key from the filter object in JavaScript/TypeScript.
    // delete filter["searchTerm"]
    // delete filter["sort"]

    const excludedFields = ["searchTerm", "sort"]

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

    const allTours = await Tour.find(searchQuery).find(filter).sort(sort as string)
    const totalTours = await Tour.countDocuments();
    const meta = {
        total: totalTours,
    }
    return {
        data: allTours,
        meta: meta
    }
};
```

- lets separate the constant
- app-> constants.ts  as it will be used in different modules
```ts
export const excludedFields = ["searchTerm", "sort"]
```

- tour.service.ts 

```ts 
const getAllTours = async (query: Record<string, unknown>) => {
    const filter = query
    const searchTerm = query.searchTerm || ""

    const sort = query.sort || "-createdAt"

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

    const allTours = await Tour.find(searchQuery).find(filter).sort(sort as string)
    const totalTours = await Tour.countDocuments();
    const meta = {
        total: totalTours,
    }
    return {
        data: allTours,
        meta: meta
    }
};
```

#### Field Limiting
- its like we want to see some specific field 
- for this we have to hit 

```
http://localhost:5000/api/v1/tours?fields=title
```
- this will give us the title 

```
http://localhost:5000/api/v1/tours?fields=-title
```
- this will give us all the fields except the title 

```
http://localhost:5000/api/v1/tours?fields=title,location
```
- this will give us the title and location field only 

#### Now Lets Implement the Filed limiting 

- First of we have to remove the fields filed from the qu4ery for filter 

```ts 
export const excludedFields = ["searchTerm", "sort", "fields"]
```
- now we have to use `select()` for field limiting 

- tour.service.ts
````ts 
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
```