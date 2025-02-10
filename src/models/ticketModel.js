
import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { GET_DB } from '~/config/mongodb'

// Define Collection (name & schema)
const TICKET_COLLECTION_NAME = 'tickets'
// Định nghĩa schema cho ticket
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

// Danh sách các trường hợp lệ
const VALID_UPDATE_FIELDS = [
  "fullName", "email", "phone", "address", "description", "file",
  "category", "subCategory"
];

const updateById = async (id, updateData) => {
  try {
    console.log("Updating Ticket ID:", id);

    const db = GET_DB();
    if (!db) throw new Error("Database connection is not established");

    // 🔥 Lọc chỉ các trường hợp lệ
    const filteredUpdateData = Object.keys(updateData)
      .filter((key) => VALID_UPDATE_FIELDS.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});


    if (Object.keys(filteredUpdateData).length === 0) {
      console.warn("⚠ Warning: No valid fields to update.");
      return null; // Không có gì để cập nhật
    }

    const updateResult = await db.collection("tickets").updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: filteredUpdateData }
    );


    if (updateResult.modifiedCount === 0) {
      console.warn("⚠ Warning: No document was modified.");
    }

    // 🔥 Trả về dữ liệu sau khi cập nhật
    const updatedDocument = await db.collection("tickets").findOne({ _id: new ObjectId(id) });

    console.log("MongoDB Updated Document:", updatedDocument);
    return updatedDocument;
  } catch (error) {
    console.error("MongoDB Update Error:", error);
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
