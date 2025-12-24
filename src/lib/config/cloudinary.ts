// cloudinaryConfig.js
const cloudinary = require("cloudinary").v2;

// Only configure Cloudinary when all required env vars are present.
if (process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  // Avoid noisy runtime errors from the Cloudinary SDK when env vars are missing.
  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.warn(
      "Cloudinary not configured: missing CLOUDINARY_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET. Cloudinary features will be disabled."
    );
  }
}

export default cloudinary;
