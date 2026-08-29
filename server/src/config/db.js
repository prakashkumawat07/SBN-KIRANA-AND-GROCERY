import mongoose from 'mongoose';

mongoose.set('strictQuery',true);
// Request payload/query keys containing $, dots or prototype keys are rejected in security middleware.
// Keep Mongoose sanitizeFilter off so trusted server-side operators like $in/$ne/$gte work correctly.
mongoose.set('sanitizeFilter',false);

let connectionPromise;

export async function connectDB(){
  if(mongoose.connection.readyState===1)return mongoose.connection;
  const uri=process.env.ATLASDB_MONGODB_URI||process.env.ATLASDB_URL||process.env.MONGODB_URL||process.env.MONGODB_URI||process.env.MONGO_URI||process.env.STORAGE_URL;
  if(!uri)throw new Error('MongoDB connection string is missing');
  if(!/^mongodb(\+srv)?:\/\//i.test(uri))throw new Error('MongoDB connection string is invalid');
  if(!connectionPromise){
    connectionPromise=mongoose.connect(uri,{serverSelectionTimeoutMS:10000,maxPoolSize:10,minPoolSize:0})
      .then(m=>{if(process.env.NODE_ENV!=='production')console.log('MongoDB connected');return m.connection})
      .catch(err=>{connectionPromise=null;throw err});
  }
  return connectionPromise;
}
