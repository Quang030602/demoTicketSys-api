import { ObjectId } from "mongodb";
import { slugify } from "~/utils/formatters";
import { ticketModel } from "~/models/ticketModel";
import { GET_DB } from '~/config/mongodb'

const createNew = async (reqBody) => {
  try {
    //console.log("✅ userId nhận từ frontend:", reqBody.userId, "Type:", typeof reqBody.userId);

    if (!reqBody.userId || typeof reqBody.userId !== "string") {
      throw new Error("Invalid userId format: userId must be a string");
    }

    // ✅ Chuyển userId thành ObjectId nếu backend yêu cầu
    const newTicket = { ...reqBody, userId: reqBody.userId };

    //console.log("✅ userId trước khi lưu vào DB:", newTicket.userId, "Type:", typeof newTicket.userId);

    const createdTicket = await ticketModel.createNew(newTicket);
    return await ticketModel.findOneById(createdTicket.insertedId);
  } catch (error) {
    console.error("❌ Lỗi trong ticketService:", error.message);
    throw error;
  }
};


// Cập nhật ticket

const updateById = async (id, updateData, ticketFile) => {
  try {
    //console.log("Service - Received ID:", id); // ✅ Debug ID

    const objectId = new ObjectId(String(id));
    if (ticketFile) {
      updateData.file = ticketFile.filename;
    } 
    const updatedTicket = await ticketModel.updateById(objectId, updateData);

    //console.log("Service - Updated Ticket:", updatedTicket); // ✅ Debug dữ liệu sau cập nhật

    return updatedTicket;
  } catch (error) {
    console.error("Service - Error Updating Ticket:", error);
    throw error;
  }
};
// Xóa ticket
const deleteById = async (id) => {
  try {
    await ticketModel.deleteById(id);
    return { message: "Ticket deleted successfully!" };
  } catch (error) {
    throw error;
  }
};

const getAll = async (query) => {
  try {
    //console.log("Query in service:", query);
    const { search, userId } = query; // Lấy userId từ query
    let filter = {};

    // Nếu có userId, thêm vào bộ lọc
    if (userId) {
      if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid userId format. Must be a valid ObjectId.");
      }
      filter.userId = userId;
    }
    
    // Nếu có search, tìm trong các trường liên quan (KHÔNG phân biệt chữ hoa, chữ thường)
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { subCategory: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ];
    }
    //console.log("Filter:", filter.userId);
    return await ticketModel.findAll(filter);
  } catch (error) {
    throw error;
  }
};
const updateStatus = async (id, status) => {
  try {
      const db = GET_DB();
      const updateResult = await db.collection("tickets").updateOne(
          { _id: new ObjectId(String(id)) },
          { $set: { status, updatedAt: Date.now() } }
      );

      if (updateResult.modifiedCount === 0) {
          return null;
      }

      return await db.collection("tickets").findOne({ _id: new ObjectId(id) });
  } catch (error) {
      throw new Error(error);
  }
};
const findOneById = async (id) => {
  try {
      const db = GET_DB();
      const ticket = await db.collection("tickets").findOne({ _id: new ObjectId(id) });

      return ticket;
  } catch (error) {
      throw new Error(error);
  }
};
const getTicketsByStatus = async (status) => {
  try {
    const tickets = await ticketModel.findByStatus(status);
    return tickets;
  } catch (error) {
    throw error;
  }
};
const getTicketsByUser = async (userId) => {
  try {
    const tickets = await ticketModel.findAll({ userId }); // Lọc ticket theo userId
    return tickets;
  } catch (error) {
    throw error;
  }
};


export const ticketService = {
  createNew,
  updateById,
  deleteById,
  getAll,
  updateStatus,
  findOneById,
  getTicketsByStatus,
  getTicketsByUser
};
