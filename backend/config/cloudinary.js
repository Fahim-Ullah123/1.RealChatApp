import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET, // Click 'View API Keys' above to copy your API secret
  });
};

export const uploadOnCloud = async (filePath) => {
  configureCloudinary();
  try {
    // Upload an image
    const uploadResult = await cloudinary.uploader.upload(filePath);
    fs.unlinkSync(filePath);
    return uploadResult.secure_url;
  } catch (error) {
    fs.unlink(filePath);
    console.log(error);
  }
};

export const uploadMediaOnCloud = async (filePath, resourceType) => {
  configureCloudinary();
  try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      resource_type: resourceType,
    });
    fs.unlinkSync(filePath);
    return {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    };
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw error;
  }
};

export const deleteFromCloud = async (publicId, resourceType) => {
  if (!publicId) return;
  configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};
