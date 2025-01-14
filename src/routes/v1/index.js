
import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { exampleRoute } from '~/routes/v1/exampleRoute'

const Router = express.Router()
Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({
    message: 'API V1 is working fine!' })

})

Router.use('/example', exampleRoute)

export const APIs_V1 = Router