import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Define expected environment variables
interface EnvConfig {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    MONGO_URI: string;
    JWT_SECRET: string;
    MQTT_URL: string;
    REDIS_URL?: string; // optional
}

// Parse + validate env variables
export const env: EnvConfig = {
    NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
    PORT: parseInt(process.env.PORT || "4000", 10),
    MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/iot-monitor",
    JWT_SECRET: process.env.JWT_SECRET || "supersecret",
    MQTT_URL: process.env.MQTT_URL || "mqtt://localhost:1883",
    REDIS_URL: process.env.REDIS_URL,
};

