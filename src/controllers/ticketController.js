import { ObjectId } from "mongodb";
import { StatusCodes } from "http-status-codes";
import { ticketService } from "~/services/ticketService";

const createNew = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded?._id; // ✅ Lấy userId từ token

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized: Missing userId" });
    }

    const ticketData = { ...req.body, userId }; // ✅ Thêm userId vào dữ liệu gửi đến Service

    const ticket = await ticketService.createNew(ticketData);
    res.status(StatusCodes.CREATED).json(ticket);
  } catch (error) {
    next(error);
  }
};


const updateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticketFile = req.file;   
    console.log("Controller -> File uploaded:", ticketFile);
   
    // Debug ID
    console.log("Received ID:", id);
    //console.log("Is ID Valid:", ObjectId.isValid(id));

    // Kiểm tra nếu ID không hợp lệ
    if (!ObjectId.isValid(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        message: "Invalid ticket ID format. Must be a 24-character hex string.", 
        receivedId: id
      });
    }

    const ticket = await ticketService.updateById(id, req.body,ticketFile);
    
    if (!ticket) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Ticket not found." });
    }

    res.status(StatusCodes.OK).json(ticket);
  } catch (error) {
    next(error);
  }
};

const deleteById = async (req, res, next) => {
  try {
    const message = await ticketService.deleteById(req.params.id);
    res.status(StatusCodes.OK).json(message);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded?._id; // ✅ Lấy userId từ token đã giải mã

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized: Missing userId" });
    }

    const query = { ...req.query, userId }; // ✅ Truyền userId vào query để lọc theo user

    const tickets = await ticketService.getAll(query);
    res.status(StatusCodes.OK).json(tickets);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['Open', 'In Progress', 'Resolved', 'Closed'].includes(status)) {
          return res.status(StatusCodes.BAD_REQUEST).json({
              message: "Invalid status value"
          });
      }

      const updatedTicket = await ticketService.updateStatus(id, status);
      if (!updatedTicket) {
          return res.status(StatusCodes.NOT_FOUND).json({ message: "Ticket not found" });
      }

      res.status(StatusCodes.OK).json(updatedTicket);
  } catch (error) {
      next(error);
  }
};

const getStatus = async (req, res, next) => {
  try {
      const { id } = req.params;
      const ticket = await ticketService.findOneById(id);

      if (!ticket) {
          return res.status(StatusCodes.NOT_FOUND).json({ message: "Ticket not found" });
      }

      res.status(StatusCodes.OK).json({ status: ticket.status });
  } catch (error) {
      next(error);
  }
};
const getOpenTickets = async (req, res, next) => {
  try {
    const tickets = await ticketService.getTicketsByStatus("Open");
    res.status(StatusCodes.OK).json(tickets);
  } catch (error) {
    next(error);
  }
};

const getClosedTickets = async (req, res, next) => {
  try {
    const tickets = await ticketService.getTicketsByStatus("Closed");
    res.status(StatusCodes.OK).json(tickets);
  } catch (error) {
    next(error);
  }
};
const getTicketsByUser = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded?._id; // Lấy userId từ token

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Unauthorized: Missing userId",
      });
    }

    const tickets = await ticketService.getTicketsByUser(userId); // Gọi service để lấy danh sách ticket
    res.status(StatusCodes.OK).json(tickets);
  } catch (error) {
    next(error);
  }
};

export const ticketController = {
  createNew,
  updateById,
  deleteById,
  getAll,
  updateStatus,
  getStatus,
  getOpenTickets,
  getClosedTickets,
  getTicketsByUser
};
