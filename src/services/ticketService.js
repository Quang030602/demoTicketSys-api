import { ObjectId } from "mongodb";
import { slugify } from "~/utils/formatters";
import { ticketModel } from "~/models/ticketModel";
import { GET_DB } from '~/config/mongodb'
import { CloudinaryProvider } from "~/providers/CloudinaryProvider";

const createNew = async (reqBody, ticketFile) => {
  try {
    let fileUrl = null;
    let originalFileName = null;
    let publicId = null;

    if (ticketFile) {
      originalFileName = ticketFile.originalname;
      const uploadResult = await CloudinaryProvider.streamUpload(
        ticketFile.buffer,
        'tickets',
        originalFileName
      );
      fileUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id; // Lưu public_id
    }

    const newTicket = { 
      ...reqBody, 
      userId: reqBody.userId, 
      file: fileUrl, 
      originalFileName, 
      publicId // Lưu public_id vào cơ sở dữ liệu
    };

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
    const objectId = new ObjectId(String(id));

    // Lấy thông tin ticket hiện tại
    const existingTicket = await ticketModel.findOneById(objectId);
    if (!existingTicket) {
      throw new Error("Ticket not found");
    }

    let fileUrl = null;
    let originalFileName = null;
    let publicId = null;

    if (ticketFile) {
      // Xóa file cũ trên Cloudinary nếu có
      if (existingTicket.publicId) {
        await CloudinaryProvider.deleteFile(existingTicket.publicId);
        fileUrl = null;
        originalFileName = null; // Xóa tên file gốc
        publicId = null; // Xóa public_id
      }

      // Upload file mới lên Cloudinary
      originalFileName = ticketFile.originalname;
      const uploadResult = await CloudinaryProvider.streamUpload(
        ticketFile.buffer,
        'tickets',
        originalFileName
      );
      fileUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id; // Lưu public_id mới
    } else if (updateData.removeFile) {
      if (existingTicket.publicId) {
        //console.log("Deleting file on Cloudinary with publicId:", existingTicket.publicId);
        try {
          const deleteResult = await CloudinaryProvider.deleteFile(existingTicket.publicId);
          //console.log("Cloudinary Delete Result:", deleteResult);
        } catch (error) {
          console.error("Error deleting file on Cloudinary:", error);
        }
      } else {
        console.warn("No publicId found for the ticket. Skipping file deletion.");
      }
      fileUrl = null;
      originalFileName = null; // Xóa tên file gốc
      publicId = null; // Xóa public_id
    }
    const updatedData = {
      ...updateData,
      ...(fileUrl !== undefined && { file: fileUrl }),
      ...(originalFileName !== undefined && { originalFileName }),
      ...(publicId !== undefined && { publicId }),
    };

    const updatedTicket = await ticketModel.updateById(objectId, updatedData);
    //console.log("Updated Ticket:", updatedTicket);
    return updatedTicket;
  } catch (error) {
    console.error("Service - Error Updating Ticket:", error);
    throw error;
  }
};
// Xóa ticket
const deleteById = async (id) => {
  try {
    // Lấy thông tin ticket hiện tại
    const existingTicket = await ticketModel.findOneById(id);
    if (!existingTicket) {
      throw new Error("Ticket not found");
    }

    // Xóa file trên Cloudinary nếu có
    if (existingTicket.publicId) {
      //console.log("Deleting file on Cloudinary with publicId:", existingTicket.publicId);
      try {
        const deleteResult = await CloudinaryProvider.deleteFile(existingTicket.publicId);
        //console.log("Cloudinary Delete Result:", deleteResult);
      } catch (error) {
        console.error("Error deleting file on Cloudinary:", error);
      }
    } else {
      console.warn("No publicId found for the ticket. Skipping file deletion.");
    }

    // Xóa ticket trong cơ sở dữ liệu
    await ticketModel.deleteById(id);

    return { message: "Ticket and associated file deleted successfully!" };
  } catch (error) {
    console.error("Service - Error Deleting Ticket:", error);
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
