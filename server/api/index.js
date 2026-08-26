import app from '../src/app.js';
import {connectDB} from '../src/config/db.js';
import {bootstrapDatabase} from '../src/utils/bootstrap.js';

// Production serverless API entrypoint.
const allowedOrigins=[
  'https://sbn-kirana-store.vercel.app',
  'https://sbn-kirana-admin.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174'
];
const allowedGatewayRoots=['/auth','/products','/orders','/contact','/paylater','/admin'];

function applyCors(req,res){
  const origin=req.headers.origin;
  const isPreview=typeof origin==='string'&&/^https:\/\/sbn-kirana-(store|admin)-.+\.vercel\.app$/.test(origin);
  if(origin&&(allowedOrigins.includes(origin)||isPreview)){
    res.setHeader('Access-Control-Allow-Origin',origin);
    res.setHeader('Vary','Origin');
  }
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
}

function applyHealthGateway(req){
  const parsed=new URL(req.url||'/', 'https://sbn-kirana.local');
  if(parsed.pathname!=='/service/health'&&!parsed.pathname!=='/api/health')return;
  const route=parsed.searchParams.get('__route');
  if(!route)return;
  const safe=allowedGatewayRoots.some(root=>route===root||route.startsWith(`${root}/`));
  if(!safe)throw new Error('Invalid gateway route');
  parsed.searchParams.delete('__route');
  const query=parsed.searchParams.toString();
  req.url=`/api${route}${query?`?${query}`:''}`;
}

export default async function handler(req,res){
  applyCors(req,res);
  if(req.method==='OPTIONS') return res.status(204).end();

  try{
    applyHealthGateway(req);
    await connectDB();
    await bootstrapDatabase();
    return app(req,res);
  }catch(error){
    console.error('API startup error:',error.message);
    if(error.message==='Invalid gateway route')return res.status(400).json({message:error.message});
    return res.status(500).json({message:'Database connection failed'});
  }
}
