import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import payLaterRoutes from './routes/payLaterRoutes.js';
import marketingRoutes from './routes/marketingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import {notFound,errorHandler} from './middleware/error.js';

const app=express();
const allowed=[
  'http://localhost:5173','http://localhost:5174',
  'https://sbn-kirana-store.vercel.app','https://sbn-kirana-admin.vercel.app',
  process.env.CLIENT_URL,process.env.ADMIN_URL
].filter(Boolean);

function isAllowedOrigin(origin){
  if(!origin)return true;
  if(allowed.includes(origin))return true;
  return /^https:\/\/sbn-kirana-(store|admin)-.+\.vercel\.app$/.test(origin);
}

app.use(cors({origin:(origin,cb)=>isAllowedOrigin(origin)?cb(null,true):cb(new Error('Origin not allowed')),methods:['GET','POST','PUT','PATCH','DELETE','OPTIONS'],allowedHeaders:['Content-Type','Authorization'],optionsSuccessStatus:204}));
app.options(/.*/,cors());
app.use(express.json({limit:'1mb'}));
app.use(morgan('dev'));

const health=(req,res)=>res.json({status:'ok',service:'SBN Kirana API',features:['paylater','inventory','reports','workers','cash','marketing','coupons']});

app.get('/api/health',health);
app.use('/api/auth',authRoutes);
app.use('/api/products',productRoutes);
app.use('/api/orders',orderRoutes);
app.use('/api/contact',contactRoutes);
app.use('/api/paylater',payLaterRoutes);
app.use('/api/offers',marketingRoutes);
app.use('/api/admin',adminRoutes);

app.get('/service/health',health);
app.use('/service/auth',authRoutes);
app.use('/service/products',productRoutes);
app.use('/service/orders',orderRoutes);
app.use('/service/contact',contactRoutes);
app.use('/service/paylater',payLaterRoutes);
app.use('/service/offers',marketingRoutes);
app.use('/service/admin',adminRoutes);

app.use(notFound);
app.use(errorHandler);
export default app;
