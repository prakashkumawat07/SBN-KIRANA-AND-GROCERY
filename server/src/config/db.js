import mongoose from 'mongoose';

let connectionPromise;

export async function connectDB(){
  if(mongoose.connection.readyState===1)return mongoose.connection;
  // Prefer the Vercel MongoDB Atlas integration variable first so any old/manual placeholder
  // variables cannot override the real managed connection string.
  const uri=process.env.ATLASDB_MONGODB_URI||process.env.ATLASDB_URL||process.env.MONGODB_URL||process.env.MONGODB_URI||process.env.MONGO_URI||process.env.STORAGE_URL;
  if(!uri)throw new Error('MongoDB connection string is missing');
  if(!connectionPromise){
    connectionPromise=mongoose.connect(uri,{serverSelectionTimeoutMS:10000})
      .then(m=>{console.log('MongoDB connected');return m.connection})
      .catch(err=>{connectionPromise=null;throw err});
  }
  return connectionPromise;
}
