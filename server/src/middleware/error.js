export function notFound(req,res){res.status(404).json({message:'Route not found'})}

export function errorHandler(err,req,res,next){
  const status=Number(err.status||err.statusCode)||500;
  const safeStatus=status>=400&&status<600?status:500;
  const isProd=process.env.NODE_ENV==='production';
  if(safeStatus>=500)console.error('Request failed',{method:req.method,path:req.path,status:safeStatus,name:err.name,message:err.message});
  const publicMessage=safeStatus>=500&&isProd?'Internal server error':String(err.message||'Request failed').slice(0,300);
  res.status(safeStatus).json({message:publicMessage});
}
