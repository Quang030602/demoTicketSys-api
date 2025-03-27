import cloudinary from 'cloudinary'
import streamifier from 'streamifier'
import { env } from '~/config/environment'
import slugify from 'slugify'; 

const cloudinaryV2 = cloudinary.v2
cloudinaryV2.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true
})

const streamUpload = (fileBuffer, folderName, originalFileName) => {
  return new Promise((resolve, reject) => {
    // Xử lý tên file để loại bỏ ký tự đặc biệt
    const sanitizedFileName = slugify(originalFileName, { lower: true, strict: true });

    const stream = cloudinaryV2.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: 'raw', // Sử dụng resource_type: 'raw' cho file không phải hình ảnh
        public_id: sanitizedFileName, // Đặt tên file theo originalFileName
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          console.error("Cloudinary Upload Error:", error); // Log lỗi chi tiết
          reject(error);
        }
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};
const deleteFile = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinaryV2.uploader.destroy(
      publicId, // Đúng cú pháp: Truyền publicId trực tiếp
      { resource_type: 'raw' }, // Tham số thứ hai là options
      (error, result) => {
        if (error) {
          console.error("Cloudinary Delete Error:", error);
          reject(error);
        } else {
          //console.log("Cloudinary Delete Result:", result);
          resolve(result);
        }
      }
    );
  });
};

export const CloudinaryProvider = { streamUpload, deleteFile }
