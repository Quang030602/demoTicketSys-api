import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

const createNew = async (req, res, next) => {
  // Cập nhật schema để phù hợp với dữ liệu mới
  const ticketSchema = Joi.object({
    userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    fullName: Joi.string().required().min(3).max(100).trim().strict(),
    email: Joi.string().email().required().trim().strict(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required().trim().strict(),
    address: Joi.string().required().min(5).max(255).trim().strict(),
    description: Joi.string().required().min(3).max(1024).strict(),
    file: Joi.string().allow(null, ''), // Chấp nhận null hoặc URL file
    category: Joi.string().valid('technical', 'billing', 'support','general').required().trim().strict(),
    subCategory: Joi.string().required().trim().strict().allow(null,'')
  });

  try {
    // Kiểm tra dữ liệu từ request body
    await ticketSchema.validateAsync(req.body, { abortEarly: false });
    next(); // Chuyển sang controller nếu hợp lệ
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message));
  }
};

export const ticketValidation = {
  createNew
};
