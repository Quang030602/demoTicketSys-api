
import express from  'express'
import { StatusCodes } from 'http-status-codes'
import { ticketRoute } from '~/routes/v1/ticketRoute'

const Router = express.Router()
Router.get('/status', (req, res) => {
    res.status(StatusCodes.OK).json({
        message: 'API V1 is working fine!'
    })
})

Router.use('/tickets', ticketRoute)

export const APIs_V1 = Router