import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import fs from 'fs';
import { config } from 'dotenv';

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for images (for thumbnails)
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'course-thumbnails', // Cloudinary folder for images
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// Storage for video uploads -> disk storage so we can process & upload to Cloudinary
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'temp');
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch (e) {}
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    const stamp = Date.now();
    cb(null, `${base}_${stamp}${ext}`);
  }
});

// Set up multer with storage
const upload = multer({ storage: imageStorage });
const uploadVideo = multer({ storage: videoStorage });

export { upload, uploadVideo };
