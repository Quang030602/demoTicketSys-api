import { ObjectId } from "mongodb";
import { StatusCodes } from "http-status-codes";
import { ticketService } from "~/services/ticketService";

const createNew = async (req, res, next) => {
  try {
    const ticket = await ticketService.createNew(req.body);
    res.status(StatusCodes.CREATED).json(ticket);
  } catch (error) {
    next(error);
  }
};

const updateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Debug ID
    console.log("Received ID:", id);
    console.log("Is ID Valid:", ObjectId.isValid(id));

    // Kiểm tra nếu ID không hợp lệ
    if (!ObjectId.isValid(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        message: "Invalid ticket ID format. Must be a 24-character hex string.", 
        receivedId: id
      });
    }

    const ticket = await ticketService.updateById(id, req.body);
    
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
    const tickets = await ticketService.getAll(req.query);
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

export const ticketController = {
  createNew,
  updateById,
  deleteById,
  getAll,
  updateStatus,
  getStatus,
};
