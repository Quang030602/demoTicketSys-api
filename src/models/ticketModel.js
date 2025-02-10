
import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { GET_DB } from '~/config/mongodb'

// Define Collection (name & schema)
const TICKET_COLLECTION_NAME = 'tickets'
// Định nghĩa schema cho ticket
const TICKET_COLLECTION_SCHEMA = Joi.object({
    fullName: Joi.string().required().min(3).max(100).trim().strict(),
    email: Joi.string().email().required().trim().strict(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required().trim().strict(),
    address: Joi.string().required().min(5).max(255).trim().strict(),
    description: Joi.string().required().min(3).max(1024).trim().strict(),
    file: Joi.string().allow(null, ''), // Chấp nhận null hoặc URL file
    category: Joi.string().valid('technical', 'billing', 'support').required().trim().strict(),
    subCategory: Joi.string().required().trim().strict(),
    slug: Joi.string().trim().strict(), // ✅ Thêm slug vào schema
    createdAt: Joi.date().timestamp('javascript').default(Date.now),
    updatedAt: Joi.date().timestamp('javascript').default(null),
    _destroy: Joi.boolean().default(false),
  });
  

const validateBeforeCreate = async (data) => {
    return await TICKET_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
    try {
        const validData = await validateBeforeCreate(data)
        console.log(validData)
        const createTicket = await GET_DB().collection(TICKET_COLLECTION_NAME).insertOne(validData)
        return createTicket
    } catch (error) {
        throw new Error(error)
    }
}

const findOneById = async (id) => {
    try {
        const result = await GET_DB().collection(TICKET_COLLECTION_NAME).findOne({ _id: new ObjectId(String(id)) })
        return result
    } catch (error) {
        throw new Error(error)
    }
}

const updateById = async (id, updateData) => {
  try {
    console.log("Updating Ticket ID:", id); // ✅ Debug ID

    const result = await GET_DB()
      .collection("tickets")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },  // ✅ Chuyển ID thành ObjectId
        { $set: updateData },
        { returnDocument: "after" }  // ✅ Đảm bảo trả về document mới
      );

    console.log("MongoDB Result:", result); // ✅ Debug kết quả MongoDB

    return result ? result.value : null;  // ✅ Trả về document hoặc null nếu không tìm thấy
  } catch (error) {
    console.error("MongoDB Update Error:", error); // ✅ Log lỗi nếu có
    throw new Error(error);
  }
};

const deleteById = async (id) => {
  try {
    await GET_DB()
      .collection(TICKET_COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(String(id)) });
  } catch (error) {
    throw new Error(error);
  }
};

const findAll = async (filter, page, limit) => {
  try {
    return await GET_DB()
      .collection(TICKET_COLLECTION_NAME)
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
  } catch (error) {
    throw new Error(error);
  }
};

export const ticketModel = {
    TICKET_COLLECTION_NAME,
    TICKET_COLLECTION_SCHEMA,
    createNew,
    findOneById,
    updateById,
    deleteById,
    findAll,
  };
