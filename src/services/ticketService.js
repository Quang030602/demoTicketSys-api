import { ObjectId } from "mongodb";
import { slugify } from "~/utils/formatters";
import { ticketModel } from "~/models/ticketModel";
import { GET_DB } from '~/config/mongodb'
import { CloudinaryProvider } from "~/providers/CloudinaryProvider";
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL_ADDRESS, // Đặt email trong biến môi trường
    pass: process.env.ADMIN_EMAIL_PASSWORD // Dùng mật khẩu ứng dụng
  }
})
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
      publicId = uploadResult.public_id;
    }

    const newTicket = { 
      ...reqBody, 
      userId: reqBody.userId, 
      file: fileUrl, 
      originalFileName, 
      publicId 
    };
    
    const createdTicket = await ticketModel.createNew(newTicket);
    
    // Lấy thông tin ticket đầy đủ sau khi tạo
    const fullTicket = await ticketModel.findOneById(createdTicket.insertedId);
    
    // Kiểm tra email tồn tại trước khi gửi
    if (reqBody.email) {
      const mailOptions = {
        from: `"AiMier Support" <${process.env.ADMIN_EMAIL_ADDRESS}>`,
        to: reqBody.email, // Sử dụng email từ reqBody thay vì createdTicket
        subject: 'Your ticket has been created',
        html: `
          <h3>Your ticket has been created successfully</h3>
          <p><strong>Full Name:</strong> ${reqBody.fullName}</p>
          <p><strong>Email:</strong> ${reqBody.email}</p>
          <p><strong>Category:</strong> ${reqBody.category}</p>
          <p><strong>Subcategory:</strong> ${reqBody.subCategory || 'N/A'}</p>
          <p><strong>Description:</strong> ${reqBody.description}</p>
          ${fileUrl ? `<p><strong>Attached File:</strong> <a href="${fileUrl}">View File</a></p>` : ''}
          <p><strong>Status:</strong> Open</p>
          <p>Thank you for contacting us. We will process your request as soon as possible.</p>
        `
      };
      
      try {
        await transporter.sendMail(mailOptions);
        console.log(`Confirmation email sent to ${reqBody.email}`);
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Không throw lỗi này, chỉ log thôi để không ảnh hưởng đến việc tạo ticket
      }
    }
    
    return fullTicket;
  } catch (error) {
    console.error("❌ Lỗi trong ticketService:", error.message);
    throw error;
  }
};
// Cập nhật ticket
const updateById = async (id, updateData, ticketFile) => {
  try {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid ticket ID format");
    }
    
    const objectId = new ObjectId(String(id));
    
    // Lấy thông tin ticket hiện tại
    const existingTicket = await ticketModel.findOneById(objectId);
    
    if (!existingTicket) {
      throw new Error("Ticket not found");
    }


    let fileUrl = existingTicket.file;
    let originalFileName = existingTicket.originalFileName;
    let publicId = existingTicket.publicId;

    if (ticketFile) {
      // Xóa file cũ trên Cloudinary nếu có
      if (existingTicket.publicId) {
        try {
          await CloudinaryProvider.smartDeleteFile(existingTicket.publicId);
          console.log("Old file deleted successfully");
        } catch (error) {
          console.error("Error deleting old file:", error);
        }
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
      console.log("New file uploaded:", fileUrl);
    } else if (updateData.removeFile) {
      if (existingTicket.publicId) {
        try {
          // Sử dụng hàm smartDeleteFile để thử nhiều resource_type khác nhau
          const deleteResult = await CloudinaryProvider.smartDeleteFile(existingTicket.publicId);
          console.log("File removed successfully:", deleteResult);
        } catch (error) {
          console.error("Error removing file:", error);
        }
      }
      fileUrl = null;
      originalFileName = null;
      publicId = null;
    }

    // Chuẩn bị dữ liệu cập nhật
    const updatedData = {
      ...updateData,
      file: fileUrl,
      originalFileName,
      publicId,
      updatedAt: Date.now()
    };

    // Xóa trường removeFile nếu có
    if (updatedData.removeFile) {
      delete updatedData.removeFile;
    }

    
    // Gọi hàm cập nhật từ model
    const updatedTicket = await ticketModel.updateById(objectId, updatedData);
    
    if (!updatedTicket) {
      throw new Error("Failed to update ticket");
    }
    
    console.log("Ticket updated successfully");
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
      const ticket = await db.collection("tickets").findOne({ _id: new ObjectId(String(id)) });

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
const getTicketsByStatusAndUser = async (status, userId) => {
  try {
    if (!userId) {
      throw new Error("userId is required");
    }

    // Tạo filter với status và userId
    const filter = { 
      status, 
      userId
    };
    
    const tickets = await ticketModel.findAll(filter);
    return tickets;
  } catch (error) {
    console.error("Error in getTicketsByStatusAndUser:", error);
    throw error;
  }
}
export const ticketService = {
  createNew,
  updateById,
  deleteById,
  getAll,
  updateStatus,
  findOneById,
  getTicketsByStatus,
  getTicketsByUser,
  getTicketsByStatusAndUser
};
