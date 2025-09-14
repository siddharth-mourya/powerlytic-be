import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { seedAdmin } from './modules/Auth/seed-companny-admin.route';

async function startServer() {
    await connectDB(seedAdmin);

    app.listen(env.PORT, () => {
        console.log(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
}

startServer();
