import 'dotenv/config';
import app from './app.js';
import {connectDB} from './config/db.js';

const PORT=process.env.PORT||5000;
connectDB().then(()=>app.listen(PORT,()=>console.log(`SBN Kirana API running on http://localhost:${PORT}`))).catch(err=>{
  console.error('Startup failed',process.env.NODE_ENV==='production'?{name:err?.name||'Error'}:{name:err?.name||'Error',message:String(err?.message||'').slice(0,300)});
  process.exit(1);
});
