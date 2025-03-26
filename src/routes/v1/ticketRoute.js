import express from 'express';
import { ticketValidation } from '~/validations/ticketValidation';
import { ticketController } from '~/controllers/ticketController';
import { authMiddleware } from '~/middlewares/authMiddleware';

const Router = express.Router();

Router.route('/')
  .get(authMiddleware.isAuthorized, ticketController.getAll) // ✅ Thêm middleware xác thực
  .post(authMiddleware.isAuthorized, ticketValidation.createNew, ticketController.createNew);

  
Router.get('/open', ticketController.getOpenTickets);
Router.get('/closed', ticketController.getClosedTickets);
  
  
Router.route('/:id')
  .put(ticketController.updateById) // API cập nhật ticket
  .delete(ticketController.deleteById); // API xóa ticket

Router.patch('/:id/status', ticketController.updateStatus);
Router.get('/:id/status', ticketController.getStatus);

Router.get('/user/:userId', ticketController.getTicketsByUser);

export const ticketRoute = Router;
