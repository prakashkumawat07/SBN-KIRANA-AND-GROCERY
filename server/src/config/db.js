import mongoose from 'mongoose';

let connectionPromise;

export async function connectDB(){
  if(mongoose.connection.readyState===1)return mongoose.connection;
  if(!process.env.MONGO_URI)throw new Error('MONGO_URI is missing');
  if(!connectionPromise){
    connectionPromise=mongoose.connect(process.env.MONGO_URI,{serverSelectionTimeoutMS:10000})
      .then(m=>{console.log('MongoDB connected');return m.connection})
      .catch(err=>{connectionPromise=null;throw err});
  }
  return connectionPromise;
}
