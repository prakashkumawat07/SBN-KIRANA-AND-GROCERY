import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import {notFound,errorHandler} from './middleware/error.js';

const app=express();
const allowed=[
  'http://localhost:5173',
  'http://localhost:5174',
  'https://sbn-kirana-store.vercel.app',
  'https://sbn-kirana-admin.vercel.app',
  process.env.CLIENT_URL,
  process.env.ADMIN_URL
].filter(Boolean);

app.use(cors({origin:(origin,cb)=>!origin||allowed.includes(origin)?cb(null,true):cb(new Error('Origin not allowed'))}));
app.use(express.json({limit:'1mb'}));
app.use(morgan('dev'));
app.get('/api/health',(req,res)=>res.json({status:'ok',service:'SBN Kirana API'}));
app.use('/api/auth',authRoutes);
app.use('/api/products',productRoutes);
app.use('/api/orders',orderRoutes);
app.use('/api/contact',contactRoutes);
app.use('/api/admin',adminRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
