import { ObjectId } from "mongodb";
import { slugify } from "~/utils/formatters";
import { ticketModel } from "~/models/ticketModel";
import { GET_DB } from '~/config/mongodb'

const createNew = async (reqBody) => {
  try {
    // Tạo slug nhưng không đưa vào validate
    const newTicket = { ...reqBody, slug: slugify(reqBody.fullName) };
    
    // Xóa slug trước khi validate
    delete newTicket.slug;

    const createTicket = await ticketModel.createNew(newTicket);
    return await ticketModel.findOneById(createTicket.insertedId);
  } catch (error) {
    throw error;
  }
};

// Cập nhật ticket

const updateById = async (id, updateData) => {
  try {
    //console.log("Service - Received ID:", id); // ✅ Debug ID

    const objectId = new ObjectId(String(id));
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
    const { page = 1, limit = 10, search } = query;
    let filter = {};

    // Nếu có search, tìm trong category hoặc subCategory (KHÔNG phân biệt chữ hoa, chữ thường)
    if (search) {
      filter = {
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
          { subCategory: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } }
        ]
      };
    }

    return await ticketModel.findAll(filter, parseInt(page), parseInt(limit));
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

export const ticketService = {
  createNew,
  updateById,
  deleteById,
  getAll,
  updateStatus,
  findOneById,
  getTicketsByStatus,
};
