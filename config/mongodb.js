import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://travel-agency:Vignesh%4022@cluster0.ialfq.mongodb.net/knowledge-discovery?retryWrites=true&w=majority&appName=Cluster0';

if (!mongoUri) {
  throw new Error('Missing MongoDB connection URI. Please set MONGODB_URI in your .env file');
}

let isConnected = false;

export async function connectToMongoDB() {
  if (isConnected) {
    console.log('MongoDB already connected');
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      // Remove deprecated options for newer mongoose versions
    });
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectFromMongoDB() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
    throw error;
  }
}

export default mongoose;

