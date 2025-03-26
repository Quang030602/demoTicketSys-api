import express from 'express';
import { ticketValidation } from '~/validations/ticketValidation';
import { ticketController } from '~/controllers/ticketController';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddleware';

const Router = express.Router();

Router.route('/')
  .get(authMiddleware.isAuthorized, ticketController.getAll) // ✅ Thêm middleware xác thực
  .post(
    authMiddleware.isAuthorized, 
    multerUploadMiddleware.upload.single('file'),  
    ticketValidation.createNew, 
    ticketController.createNew
  );

  
Router.get('/open', ticketController.getOpenTickets);
Router.get('/closed', ticketController.getClosedTickets);
  
  
Router.route('/:id')
  .put(
    authMiddleware.isAuthorized,
    multerUploadMiddleware.upload.single('file'), // ✅ Thêm middleware upload file
    ticketController.updateById
  ) // API cập nhật ticket
  .delete(ticketController.deleteById); // API xóa ticket

Router.patch('/:id/status', ticketController.updateStatus);
Router.get('/:id/status', ticketController.getStatus);

Router.get('/user/:userId', ticketController.getTicketsByUser);

export const ticketRoute = Router;
