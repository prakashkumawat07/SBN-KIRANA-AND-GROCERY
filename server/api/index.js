import app from '../src/app.js';
import {connectDB} from '../src/config/db.js';
import {bootstrapDatabase} from '../src/utils/bootstrap.js';

export default async function handler(req,res){
  try{
    await connectDB();
    await bootstrapDatabase();
    return app(req,res);
  }catch(error){
    console.error('API startup error:',error.message);
    return res.status(500).json({message:'Database connection failed'});
  }
}
