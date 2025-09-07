import express, { Request, Response } from "express";

const app = express();

// Built-in middleware to parse JSON bodies
app.use(express.json());

// Simple health / root route
app.get("/", (_req: Request, res: Response) => {
    res.send("Hello Monitoring Platform 🚀");
});

// Basic health endpoint (useful for probes)
app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, ts: new Date().toISOString() });
});

export default app;
