import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null

        //upload file on cloudnary

        const response = await cloudinary.uploader.upload(localFilePath, 
            {
                resource_type: "auto"
            }
        )

        // file uploaded successfully

        console.log("File uploaded successfully", response.url);
        fs.unlink(localFilePath)
        return response;
    } catch (error) {
        //file not uploaded

        fs.unlink(localFilePath)
        return null;
    }
}

export {uploadOnCloudinary}