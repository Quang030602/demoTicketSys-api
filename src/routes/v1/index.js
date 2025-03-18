import express from 'express';
import { StatusCodes } from 'http-status-codes'

import { ticketRoute } from './ticketRoute'; 
import { userRoute } from './userRoute';

const Router = express.Router();

Router.get('/status', (req, res) => {
    res.status(StatusCodes.OK).json({
        message: 'API V1 is working fine!'
    })

})

// Thêm route `/tickets`
Router.use('/tickets', ticketRoute);

Router.use('/users', userRoute)

export const APIs_V1 = Router;
