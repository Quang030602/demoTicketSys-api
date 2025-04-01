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
        resource_type: 'image', // Chỉ định loại resource là hình ảnh
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
const deleteFile = (publicId, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    // Không sử dụng 'auto' mà sử dụng tham số resourceType đã chỉ định
    const options = {
      resource_type: resourceType, // 'image', 'video', 'raw', etc.
      invalidate: true            // Đảm bảo các bản cache bị xóa
    };

    console.log(`Trying to delete file with publicId: ${publicId}, resource_type: ${resourceType}`);

    cloudinaryV2.uploader.destroy(
      publicId,
      options,
      (error, result) => {
        if (error) {
          console.error("Cloudinary Delete Error:", error);
          reject(error);
        } else {
          console.log("Cloudinary Delete Result:", result);
          resolve(result);
        }
      }
    );
  });
};

// Thêm hàm mới để thử xóa file với nhiều resource_type khác nhau
const smartDeleteFile = (publicId) => {
  return new Promise(async (resolve, reject) => {
    // Danh sách các loại resource cần thử
    const resourceTypes = ['image', 'video', 'raw'];
    let success = false;

    for (const resourceType of resourceTypes) {
      try {
        console.log(`Attempting to delete with resource_type: ${resourceType}`);
        const result = await deleteFile(publicId, resourceType);
        success = true;
        console.log(`Successfully deleted with resource_type: ${resourceType}`);
        resolve(result);
        break;
      } catch (error) {
        console.log(`Failed to delete with resource_type: ${resourceType}. Error: ${error.message}`);
        // Continue to try the next resource_type
      }
    }

    if (!success) {
      reject(new Error(`Failed to delete file with publicId: ${publicId}`));
    }
  });
};

export const CloudinaryProvider = { streamUpload, deleteFile, smartDeleteFile }