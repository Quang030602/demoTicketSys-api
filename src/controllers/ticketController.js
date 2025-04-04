import { ObjectId } from "mongodb";
import { StatusCodes } from "http-status-codes";
import { ticketService } from "~/services/ticketService";

const createNew = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded?._id;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized: Missing userId" });
    }

    const ticketData = { ...req.body, userId };
    const ticketFile = req.file;

    const ticket = await ticketService.createNew(ticketData, ticketFile);
    res.status(StatusCodes.CREATED).json(ticket);
  } catch (error) {
    next(error);
  }
};


const updateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticketFile = req.file;
    
    // Log để debug
    console.log("Update request for ticket ID:", id);
    console.log("Update data:", req.body);
    console.log("File included:", ticketFile ? "Yes" : "No");
    
    // Kiểm tra nếu ID không hợp lệ
    if (!ObjectId.isValid(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        message: "Invalid ticket ID format" 
      });
    }

    const ticket = await ticketService.updateById(id, req.body, ticketFile);
    
    if (!ticket) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        message: "Ticket not found or update failed" 
      });
    }

    res.status(StatusCodes.OK).json(ticket);
  } catch (error) {
    console.error("Controller - Error updating ticket:", error);
    if (error.message === "Ticket not found") {
      return res.status(StatusCodes.NOT_FOUND).json({ message: error.message });
    }
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
    const userId = req.jwtDecoded?._id; // Lấy userId từ token đã giải mã

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ 
        message: "Unauthorized: Missing userId" 
      });
    }

    const tickets = await ticketService.getTicketsByStatusAndUser("Open", userId);
    res.status(StatusCodes.OK).json(tickets);
  } catch (error) {
    next(error);
  }
};

const getClosedTickets = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded?._id; // Lấy userId từ token đã giải mã

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ 
        message: "Unauthorized: Missing userId" 
      });
    }

    const tickets = await ticketService.getTicketsByStatusAndUser("Closed", userId);
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
