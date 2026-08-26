import {Router} from 'express';
import {protect,adminOnly} from '../middleware/auth.js';
import {
  dashboard,products,createProduct,updateProduct,deleteProduct,orders,updateOrderStatus,customers,messages,
  payLaterCustomers,updatePayLater,recordPayLaterPayment,recordRecoveryAction,stock,updateStock,reports,
  workers,createWorker,updateWorker,deleteWorker,cashEntries,createCashEntry,deleteCashEntry,
  admins,createAdmin,updateAdmin
} from '../controllers/adminController.js';
import {offers,createOffer,updateOffer,deleteOffer} from '../controllers/adminMarketingController.js';

const r=Router();
r.use(protect,adminOnly);
r.get('/dashboard',dashboard);
r.get('/products',products);r.post('/products',createProduct);r.put('/products/:id',updateProduct);r.delete('/products/:id',deleteProduct);
r.get('/orders',orders);r.patch('/orders/:id/status',updateOrderStatus);
r.get('/customers',customers);r.get('/messages',messages);
r.get('/paylater',payLaterCustomers);r.patch('/paylater/:id',updatePayLater);r.post('/paylater/:id/payment',recordPayLaterPayment);r.post('/paylater/:id/recovery',recordRecoveryAction);
r.get('/stock',stock);r.patch('/stock/:id',updateStock);
r.get('/reports',reports);
r.get('/offers',offers);r.post('/offers',createOffer);r.patch('/offers/:id',updateOffer);r.delete('/offers/:id',deleteOffer);
r.get('/workers',workers);r.post('/workers',createWorker);r.patch('/workers/:id',updateWorker);r.delete('/workers/:id',deleteWorker);
r.get('/cash',cashEntries);r.post('/cash',createCashEntry);r.delete('/cash/:id',deleteCashEntry);
r.get('/admins',admins);r.post('/admins',createAdmin);r.patch('/admins/:id',updateAdmin);
export default r;
