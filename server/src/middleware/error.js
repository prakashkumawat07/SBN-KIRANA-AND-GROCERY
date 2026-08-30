export function notFound(req,res){res.status(404).json({message:'Route not found'})}

export function errorHandler(err,req,res,next){
  let status=Number(err.status||err.statusCode)||500;
  if(err?.name==='ValidationError'||err?.name==='CastError')status=400;
  if(err?.code===11000)status=409;
  const safeStatus=status>=400&&status<600?status:500;
  const isProd=process.env.NODE_ENV==='production';
  if(safeStatus>=500){
    const raw=String(err?.message||'Request failed');
    const safeLogMessage=raw.replace(/data:[^;\s]+;base64,[A-Za-z0-9+/=]+/g,'[data-uri-redacted]').slice(0,300);
    console.error('Request failed',{method:req.method,path:req.path,status:safeStatus,name:String(err?.name||'Error').slice(0,80),message:safeLogMessage});
  }
  let publicMessage=String(err?.message||'Request failed').slice(0,300);
  if(err?.name==='ValidationError')publicMessage='Invalid request data';
  if(err?.name==='CastError')publicMessage='Invalid resource identifier';
  if(err?.code===11000)publicMessage='A record with these details already exists';
  if(safeStatus>=500&&isProd)publicMessage='Internal server error';
  res.status(safeStatus).json({message:publicMessage});
}
