
import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'

// Define Collection (name & schema)
const TICKET_COLLECTION_NAME = 'tickets'
// Định nghĩa schema cho ticket
const TICKET_COLLECTION_SCHEMA = Joi.object({
  userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  fullName: Joi.string().required().min(3).max(100).trim().strict(),
  email: Joi.string().email().required().trim().strict(),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required().trim().strict(),
  address: Joi.string().required().min(5).max(255).trim().strict(),
  description: Joi.string().required().min(3).max(1024).allow('').strict(),
  file: Joi.string().allow(null, ''),
  originalFileName: Joi.string().allow(null, ''),
  publicId: Joi.string().allow(null, ''), // Thêm trường này
  category: Joi.string().valid('general', 'technical', 'billing', 'support').required().trim().strict(),
  subCategory: Joi.alternatives().conditional('category', {
    is: 'general',
    then: Joi.allow(null, ''),
    otherwise: Joi.string().trim().strict().allow(null, ''),
  }),
  status: Joi.string().valid('Open', 'In Progress', 'Resolved', 'Closed').default('Open'),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false),
});

const validateBeforeCreate = async (data) => {
    return await TICKET_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    //console.log("✅ Trước khi validate - userId:", data.userId, "Type:", typeof data.userId);

    if (!data.userId || typeof data.userId !== "string") {
      throw new Error("userId must be a string");
    }

    const validData = await TICKET_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false });

    //console.log("✅ Sau khi validate - userId:", validData.userId, "Type:", typeof validData.userId);

    const result = await GET_DB().collection(TICKET_COLLECTION_NAME).insertOne(validData);
    return result;
  } catch (error) {
    console.error("❌ Lỗi trong ticketModel:", error.message);
    throw new Error(error);
  }
};

const findOneById = async (id) => {
    try {
        const result = await GET_DB().collection(TICKET_COLLECTION_NAME).findOne({ _id: new ObjectId(String(id)) })
        return result
    } catch (error) {
        throw new Error(error)
    }
}

// Danh sách các trường hợp lệ
const VALID_UPDATE_FIELDS = [
  "fullName", "email", "phone", "address", "description", "file",
  "category", "subCategory"
];

const updateById = async (id, updateData) => {
  try {
    const db = GET_DB();
    const updateResult = await db.collection("tickets").updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: updateData }
    );

    if (updateResult.modifiedCount === 0) {
      console.warn("⚠ Warning: No fields were updated.");
      return null;
    }

    return await db.collection("tickets").findOne({ _id: new ObjectId(id) });
  } catch (error) {
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
const findAll = async (filter) => {
  try {
    //console.log("Filter in findAll:", filter);
    return await GET_DB().collection(TICKET_COLLECTION_NAME).find(filter).toArray();
  } catch (error) {
    throw new Error(error);
  }
};

const findByStatus = async (status) => {
  try {
    const results = await GET_DB()
      .collection(TICKET_COLLECTION_NAME)
      .find({ status })
      .toArray();
    return results;
  } catch (error) {
    throw new Error(error);
  }
};
const getTicketsByUser = async (userId) => {
  try {
    const tickets = await ticketModel.findAll({ userId: new ObjectId(userId) });
    return tickets;
  } catch (error) {
    throw error;
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
    findByStatus,
    getTicketsByUser
  };
