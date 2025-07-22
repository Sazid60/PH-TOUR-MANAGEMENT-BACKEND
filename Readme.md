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
- All the data we send converted to json file but for files 9its not converted to json format. 
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
- Frontedn -> Form Data with Image File -> Multer -> Form data -> Req (Body + File)
- Amader folder -> image -> form data -> File -> Multer -> Amader project / pc te Nijer ekta folder(temporary) -> Req.file
- after getting the file in req.file we will tell cloudinary to upload the file and give me a url that will be stored in mongodb. 
- req.file -> cloudinary(req.file) -> url -> mongoose -> mongodb