import { envConfig } from 'libs/config/envConfig';
import mongoose from 'mongoose';

// Connect to MongoDB
mongoose.connect(envConfig().order_service_db, { autoIndex: false });

// Connection events
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection disconnected');
});

// Optional: Check connection state function
export function isMongoAlive(): boolean {
  return mongoose.connection.readyState === 1;
  // 0 = disconnected
  // 1 = connected
  // 2 = connecting
  // 3 = disconnecting
}
