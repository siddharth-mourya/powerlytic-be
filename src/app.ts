import express from 'express';
import { json, urlencoded } from 'body-parser';
import cors from 'cors';

// Import routes
import authRoutes from './modules/Auth/auth.route';
import organizationRoutes from './modules/Organization/Organization.route';
import userRoutes from './modules/User/User.route';
import deviceRoutes from './modules/Device/Device.route';
import deviceGroupRoutes from './modules/DeviceGroup/DeviceGroup.route';
import deviceModelRoutes from './modules/DeviceModel/DeviceModel.route';
import portRoutes from './modules/Port/Port.route';
import portTypeRoutes from './modules/PortType/PortType.route';
import valueRoutes from './modules/Value/Value.route';
import alertRoutes from './modules/Alert/Alert.route';
import healthRoutes from './modules/healthChecks/healthChecks.route';

const app = express();

app.use((req, res, next) => {
  console.log('Origin:', req.headers.origin);
  next();
});
const allowedOrigins = ['http://localhost:3000', 'http://192.168.1.4:3000'];

//cors
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true); // allow server-to-server or curl requests
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Middleware
app.use(json());
app.use(urlencoded({ extended: true }));

// API prefix
const API_PREFIX = '/api';

app.use(`${API_PREFIX}/health-check`, healthRoutes);
// Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/organizations`, organizationRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/devices`, deviceRoutes);
app.use(`${API_PREFIX}/device-groups`, deviceGroupRoutes);
app.use(`${API_PREFIX}/device-models`, deviceModelRoutes);
app.use(`${API_PREFIX}/ports`, portRoutes);
app.use(`${API_PREFIX}/port-types`, portTypeRoutes);
app.use(`${API_PREFIX}/values`, valueRoutes);
app.use(`${API_PREFIX}/alerts`, alertRoutes);

// Health Check
app.get('/', (req, res) => res.send('🚀 IoT Monitoring Backend is running'));

// Error handler (optional)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

export default app;
