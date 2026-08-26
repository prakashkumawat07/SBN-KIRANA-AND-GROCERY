export default function handler(req,res){
  const mongoAvailable=Boolean(
    process.env.ATLASDB_MONGODB_URI||
    process.env.ATLASDB_URL||
    process.env.MONGODB_URL||
    process.env.MONGODB_URI
  );
  res.status(200).json({status:'ok',mongoAvailable});
}
