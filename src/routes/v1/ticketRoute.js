import express from 'express';
import { ticketValidation } from '~/validations/ticketValidation';
import { ticketController } from '~/controllers/ticketController';

const Router = express.Router();

Router.route('/')
  .get(ticketController.getAll) // API lấy danh sách ticket
  .post(ticketValidation.createNew, ticketController.createNew); // API tạo ticket

Router.route('/:id')
  .put(ticketController.updateById) // API cập nhật ticket
  .delete(ticketController.deleteById); // API xóa ticket

Router.patch('/:id/status', ticketController.updateStatus);
Router.get('/:id/status', ticketController.getStatus);

export const ticketRoute = Router;
