
import express from 'express'
import { StatusCodes } from 'http-status-codes'

const Router = express.Router()

Router.route('/')
  .get( (req, res) => {
    res.status(StatusCodes.OK).json({ message: 'API get list board' })
  })
  .post( (req, res) => {
    res.status(StatusCodes.CREATED).json({ message: 'API create new board' })
  })

export const exampleRoute = Router