# PH-TOUR-MANAGEMENT-BACKEND-7

GitHub Link: https://github.com/Apollo-Level2-Web-Dev/ph-tour-management-system-backend/tree/part-7

## 32-1 Introduction to Multer and Cloudinary, Opening Cloudinary account and get secrets

#### What We Will Learn Here?

- file upload 
- email system 
- aggregation 

#### We will use `Multer` for file upload 

[MULTER](https://www.npmjs.com/package/multer)

- Multer is a node.js middleware for handling multipart/form-data, which is primarily used for uploading files. It is written on top of busboy for maximum efficiency.
- All the data we send converted to json file but for files its not converted to json format. 
- For files are consider4ed as form data. 
- Multer will not process any form which is not multipart (multipart/form-data).
- Install Multer 
```
npm i multer
```

```
npm install --save @types/multer
```

- we have to keep the file in a cloud platform and we will keep the url in mongodb 
- for keeping the file  we will use `cloudinary`

[cloudinary](https://console.cloudinary.com/app/c-30c565845165644fc838f40db771b1/image/getting-started)


- install cloudinary 

```ts 
npm i cloudinary
```

#### Lets see how multer works
- when data will be coming from frontend the multer will convert into two parts 
- one part is body 
- when we will upload file, multer will convert the file into a body file named object and this will be in our request like if we do `req.file` we will get the file
- Multer adds a body object and a file or files object to the request object. The body object contains the values of the text fields of the form, the file or files object contains the files uploaded via the form.
- Frontend -> Form Data with Image File -> Multer -> Form data -> Req (Body + File)
- how multer is working? 
- when we upload a file it will take the image and store in a folder (temporary) and then from the folder multer will give us the file in a `req.file`
- Frontend -> Form Data with Image File -> Multer -> Form data -> Req (Body + File)
- Amader folder -> image -> form data -> File -> Multer -> Amader project / pc te Nijer ekta folder(temporary) -> Req.file
- after getting the file in req.file we will tell cloudinary to upload the file and give me a url that will be stored in mongodb. 
- req.file -> cloudinary(req.file) -> url -> mongoose -> mongodb

## 32-2 Configure Multer and Cloudinary For Image Upload
- Cloudinary upload workflow 
```
cloudinary.v2.uploader.upload(file, options).then(callback);
```
- this is the system of cloudinary but we will do it using a package.
- this package will take the file and will do the work and will return the url inside the req.file object 

- we will use `multer-storage-cloudinary` cloudinary package 

```
npm i multer-storage-cloudinary
```
or

```
npm install multer-storage-cloudinary --legacy-peer-deps
```

- A multer storage engine for Cloudinary. Also consult the Cloudinary API.
- Raw Multer creates a temporary storage in our file system for storing the file. 
- But This package will create a temporary storage with cloudinary and then gives the cloudinary to upload. 

- Amader folder -> image -> form data -> File -> Multer -> storage in cloudinary -> url ->  req.file  -> url  -> mongoose -> mongodb

- inside multer ethis storage location will be cloudinary 

```
const upload = multer({ dest: 'uploads/' })
```
- as he does not has access to cloudinary directly so we will give him cloudinary configuration 

- cloudinary.config.ts 


```ts 
import { v2 as cloudinary } from 'cloudinary';
import { envVars } from './env';


cloudinary.config({
    cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
    api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
    api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET
})

// cloudinary.v2.uploader.upload(file, options).then(callback);
// this is the system of cloudinary but we will do it using a package.
// this package will take the file and will do the work and will return the url inside the req.file object 

export const cloudinaryUpload = cloudinary
```
- multer.config.ts 


```ts 
import multer from "multer";
import { cloudinaryUpload } from "./cloudinary.config";
import { CloudinaryStorage } from "multer-storage-cloudinary";


const storage = new CloudinaryStorage({
    cloudinary: cloudinaryUpload,
    params: {
        public_id: (req, file) => {
            // My Special.Image#!@.png => 4545adsfsadf-45324263452-my-image.png
            // My Special.Image#!@.png => [My Special, Image#!@, png]

            const fileName = file.originalname
                .toLowerCase()
                .replace(/\s+/g, "-") // empty space remove replace with dash
                .replace(/\./g, "-")
                // eslint-disable-next-line no-useless-escape
                .replace(/[^a-z0-9\-\.]/g, "") // non alpha numeric - !@#$

            const extension = file.originalname.split(".").pop()

            // binary -> 0,1 hexa decimal -> 0-9 A-F base 36 -> 0-9 a-z
            // 0.2312345121 -> "0.hedfa674338sasfamx" -> 
            //452384772534
            const uniqueFileName = Math.random().toString(36).substring(2) + "-" + Date.now() + "-" + fileName + "." + extension

            return uniqueFileName
        }
    },
});

export const multerUpload = multer({ storage: storage })
```