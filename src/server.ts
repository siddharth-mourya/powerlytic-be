import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { seedAdmin } from './modules/Auth/seed-companny-admin.route';

async function startServer() {
    try {
        // Connect to DB first
        await connectDB(() => null);
        console.log('✅ Database connected successfully');

        // Start server
        const server = app.listen(env.PORT, () => {
            console.log('Server listen callback', server.address());
            const actualPort = (server.address() as any).port; // ensures correct port
            console.log(`🚀 Server running at http://localhost:${actualPort} in ${env.NODE_ENV} mode`);
        });

        // Optional: handle server errors
        server.on('error', (err: any) => {
            console.error('❌ Server failed to start:', err);
            process.exit(1);
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

startServer();
