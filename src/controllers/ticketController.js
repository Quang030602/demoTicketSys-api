
import { StatusCodes } from "http-status-codes";

import { ticketService } from "~/services/ticketService";

const createNew = async  (req, res, next) => {
    try {
        
        const createTicket = await ticketService.createNew(req.body)
        res.status(StatusCodes.CREATED).json(createTicket)    
    } catch (error) {
        next(error)
    }
}

export const ticketController = {
    createNew
}