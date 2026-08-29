import {Router} from 'express';
import {protect,adminOnly} from '../middleware/auth.js';
import {requireStrongPassword} from '../middleware/security.js';
import {auditAdminWrites} from '../middleware/adminAudit.js';
import {
  dashboard,products,createProduct,updateProduct,deleteProduct,orders,updateOrderStatus,customers,messages,
  payLaterCustomers,updatePayLater,recordPayLaterPayment,recordRecoveryAction,stock,updateStock,reports,
  workers,createWorker,updateWorker,deleteWorker,cashEntries,createCashEntry,deleteCashEntry,
  admins,createAdmin,updateAdmin
} from '../controllers/adminController.js';
import {offers,createOffer,updateOffer,deleteOffer} from '../controllers/adminMarketingController.js';
import {adminReviews,moderateReview,deleteReview} from '../controllers/reviewController.js';
import {adminBulkOrders,adminBulkOrderDetail,updateQuotation,updateBulkStatus,updateBulkPayment,updateBulkDelivery} from '../controllers/bulkOrderController.js';
import {posSales,posSummary,createPosSale,updatePosPayment} from '../controllers/posController.js';
import {adminPayLaterApplications,adminPayLaterApplication,adminVerifyPayLaterApplication,adminDecidePayLaterApplication} from '../controllers/payLaterKycController.js';
import {adminPayLaterPayments,adminPayLaterPaymentProof,adminReviewPayLaterPayment} from '../controllers/payLaterPaymentController.js';
import {adminAuditLogs} from '../controllers/adminSecurityController.js';
import {posUsers,createPosUser,updatePosUser,resetPosPassword,signOutPosUser} from '../controllers/posStaffController.js';

const r=Router();
r.use(protect,adminOnly,auditAdminWrites);
r.get('/dashboard',dashboard);
r.get('/audit-logs',adminAuditLogs);
r.get('/products',products);r.post('/products',createProduct);r.put('/products/:id',updateProduct);r.delete('/products/:id',deleteProduct);
r.get('/orders',orders);r.patch('/orders/:id/status',updateOrderStatus);
r.get('/pos',posSales);r.get('/pos/summary',posSummary);r.post('/pos',createPosSale);r.patch('/pos/:id/payment',updatePosPayment);
r.get('/pos-users',posUsers);r.post('/pos-users',createPosUser);r.patch('/pos-users/:id',updatePosUser);r.post('/pos-users/:id/password',requireStrongPassword,resetPosPassword);r.post('/pos-users/:id/signout',signOutPosUser);
r.get('/bulk-orders',adminBulkOrders);r.get('/bulk-orders/:id',adminBulkOrderDetail);r.patch('/bulk-orders/:id/quotation',updateQuotation);r.patch('/bulk-orders/:id/status',updateBulkStatus);r.patch('/bulk-orders/:id/payment',updateBulkPayment);r.patch('/bulk-orders/:id/delivery',updateBulkDelivery);
r.get('/customers',customers);r.get('/messages',messages);
r.get('/paylater',payLaterCustomers);r.get('/paylater-applications',adminPayLaterApplications);r.get('/paylater/:id/application',adminPayLaterApplication);r.patch('/paylater/:id/application',adminVerifyPayLaterApplication);r.post('/paylater/:id/decision',adminDecidePayLaterApplication);r.patch('/paylater/:id',updatePayLater);r.post('/paylater/:id/payment',recordPayLaterPayment);r.post('/paylater/:id/recovery',recordRecoveryAction);
r.get('/paylater-payments',adminPayLaterPayments);r.get('/paylater-payments/:id/proof',adminPayLaterPaymentProof);r.patch('/paylater-payments/:id/review',adminReviewPayLaterPayment);
r.get('/stock',stock);r.patch('/stock/:id',updateStock);
r.get('/reports',reports);
r.get('/offers',offers);r.post('/offers',createOffer);r.patch('/offers/:id',updateOffer);r.delete('/offers/:id',deleteOffer);
r.get('/reviews',adminReviews);r.patch('/reviews/:id',moderateReview);r.delete('/reviews/:id',deleteReview);
r.get('/workers',workers);r.post('/workers',createWorker);r.patch('/workers/:id',updateWorker);r.delete('/workers/:id',deleteWorker);
r.get('/cash',cashEntries);r.post('/cash',createCashEntry);r.delete('/cash/:id',deleteCashEntry);
r.get('/admins',admins);r.post('/admins',requireStrongPassword,createAdmin);r.patch('/admins/:id',updateAdmin);
export default r;
