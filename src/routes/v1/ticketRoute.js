
import express from  'express'
import { StatusCodes } from 'http-status-codes'
import { ticketValidation } from '~/validations/ticketValidation'
import { ticketController } from '~/controllers/ticketController'

const Router = express.Router()

Router.route('/')
    .get( (req, res) => {
        res.status(StatusCodes.OK).json({ message: 'API get list board' })
    })
    .post(ticketValidation.createNew, ticketController.createNew)

export const ticketRoute = Router