import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import bulkOrderRoutes from './routes/bulkOrderRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import payLaterRoutes from './routes/payLaterRoutes.js';
import marketingRoutes from './routes/marketingRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import posRoutes from './routes/posRoutes.js';
import {notFound,errorHandler} from './middleware/error.js';
import {securityHeaders,rejectDangerousInput,requireJsonForWrites} from './middleware/security.js';

const app=express();
app.disable('x-powered-by');
app.set('trust proxy',1);

const allowed=['http://localhost:5173','http://localhost:5174','http://localhost:5175','https://sbn-kirana-store.vercel.app','https://sbn-kirana-admin.vercel.app','https://sbn-kirana-pos.vercel.app',process.env.CLIENT_URL,process.env.ADMIN_URL,process.env.POS_URL].filter(Boolean);
const ownedPreview=/^https:\/\/sbn-kirana-(store|admin|pos)-[a-z0-9-]+-prakashkumawat12245-2350s-projects\.vercel\.app$/i;
function isAllowedOrigin(origin){if(!origin)return true;if(allowed.includes(origin))return true;return ownedPreview.test(origin)}
const corsOptions={origin:(origin,cb)=>isAllowedOrigin(origin)?cb(null,true):cb(Object.assign(new Error('Origin not allowed'),{status:403})),methods:['GET','POST','PUT','PATCH','DELETE','OPTIONS'],allowedHeaders:['Content-Type','Authorization'],maxAge:600,optionsSuccessStatus:204};
app.use(cors(corsOptions));
app.options(/.*/,cors(corsOptions));
app.use(securityHeaders);
app.use(express.json({limit:'3mb',strict:true,type:'application/json'}));
app.use(requireJsonForWrites);
app.use(rejectDangerousInput);
if(process.env.NODE_ENV!=='production')app.use(morgan('dev'));

const health=(req,res)=>res.json({status:'ok',service:'SBN Kirana API',features:['paylater','inventory','reports','workers','cash','marketing','coupons','reviews','referrals','bulk-orders','quotations','pos','kyc']});
app.get('/api/health',health);app.use('/api/auth',authRoutes);app.use('/api/products',productRoutes);app.use('/api/orders',orderRoutes);app.use('/api/bulk-orders',bulkOrderRoutes);app.use('/api/contact',contactRoutes);app.use('/api/paylater',payLaterRoutes);app.use('/api/offers',marketingRoutes);app.use('/api/reviews',reviewRoutes);app.use('/api/admin',adminRoutes);app.use('/api/pos',posRoutes);
app.get('/service/health',health);app.use('/service/auth',authRoutes);app.use('/service/products',productRoutes);app.use('/service/orders',orderRoutes);app.use('/service/bulk-orders',bulkOrderRoutes);app.use('/service/contact',contactRoutes);app.use('/service/paylater',payLaterRoutes);app.use('/service/offers',marketingRoutes);app.use('/service/reviews',reviewRoutes);app.use('/service/admin',adminRoutes);app.use('/service/pos',posRoutes);
app.use(notFound);app.use(errorHandler);export default app;
