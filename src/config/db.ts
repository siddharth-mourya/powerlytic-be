import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(callBack: Function) {
    if (mongoose.connection.readyState === 1) {
        console.log('⚡ Using existing MongoDB connection');
        return;
    }
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(env.MONGO_URI);
        console.log('✅ MongoDB connected');
        await callBack();
        // If the Node process ends, close the Mongoose connection
        process.on('SIGINT', () => {
            mongoose.connection.close();
        });
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1); // crash if DB fails
    }
}
