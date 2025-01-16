
import { slugify } from "~/utils/formatters"
import { ticketModel } from "~/models/ticketModel"

const createNew = async (reqBody) => {
  try {
    const newTicket = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }
    const createTicket = await ticketModel.createNew(newTicket)
    const getNewTicket = await ticketModel.findOneById(createTicket.insertedId)
    return getNewTicket
  } catch (error) { throw error }
}


export const ticketService = {
  createNew
}
