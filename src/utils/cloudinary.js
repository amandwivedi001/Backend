import { v2 as cloudinary } from "cloudinary";
import { promises as fs } from "fs"; // ✅ use promise-based version

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // ✅ Upload file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // console.log("File uploaded successfully:", response.url);

        // ✅ Delete local file after successful upload
        await fs.unlink(localFilePath);

        return response;
    } catch (error) {
        console.error("Cloudinary upload error:", error);

        // ✅ Try deleting local file even if upload failed
        try {
            await fs.unlink(localFilePath);
        } catch (err) {
            console.warn("Error deleting file after failure:", err);
        }

        return null;
    }
};

export { uploadOnCloudinary };
