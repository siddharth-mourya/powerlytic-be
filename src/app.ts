import express from "express";
import { json, urlencoded } from "body-parser";
import cors from "cors";

// Import routes
import authRoutes from "./modules/Auth/auth.route";
import organizationRoutes from "./modules/Organization/Organization.route";
import userRoutes from "./modules/User/User.route";
import deviceRoutes from "./modules/Device/Device.route";
import deviceGroupRoutes from "./modules/DeviceGroup/DeviceGroup.route";
import deviceModelRoutes from "./modules/DeviceModel/DeviceModel.route";
import portRoutes from "./modules/Port/Port.route";
import portTypeRoutes from "./modules/PortType/PortType.route";
import valueRoutes from "./modules/Value/Value.route";
import alertRoutes from "./modules/Alert/Alert.route";

const app = express();

//cors
app.use(cors())

// Middleware
app.use(json());
app.use(urlencoded({ extended: true }));

// API prefix
const API_PREFIX = "/api";

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
app.get("/", (req, res) => res.send("🚀 IoT Monitoring Backend is running"));
app.get(`${API_PREFIX}/health`, (req, res) => res.send("🚀 IoT Monitoring Backend is running, health is good"));

// Error handler (optional)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal Server Error" });
});

export default app;
