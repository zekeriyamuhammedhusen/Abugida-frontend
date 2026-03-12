import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, options);
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true
    });
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
};

export const uploadVideoToCloudinary = async (filePath, options = {}) => {
  try {
    // Upload video directly to Cloudinary (true storage target)
    const uploaded = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      public_id: options.public_id,
      folder: options.folder,
      overwrite: true,
      invalidate: true
    });
    return {
      url: uploaded.secure_url,
      publicId: uploaded.public_id
    };
  } catch (error) {
    console.error('Video upload error:', error);
    throw error;
  }
};