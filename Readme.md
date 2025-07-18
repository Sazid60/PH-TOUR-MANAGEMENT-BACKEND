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

- lets understand a thing we are sending a query object but we do not know what is the type of the object or what will be the type of the object so, here we have to use record string 