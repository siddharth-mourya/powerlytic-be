import { Request, Response } from "express";
import { Value } from "./Value.model";

// Ingest telemetry
export const createValue = async (req: Request, res: Response) => {
  try {
    const value = await Value.create(req.body);
    res.status(201).json(value);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

// Fetch telemetry with filters
export const getValues = async (req: Request, res: Response) => {
  try {
    const { deviceId, portId, start, end, page = 1, limit = 50 } = req.query;

    const filter: any = {};
    if (deviceId) filter["metadata.deviceId"] = deviceId;
    if (portId) filter["metadata.portId"] = portId;
    if (start || end) filter.ts = {};
    if (start) filter.ts.$gte = new Date(start as string);
    if (end) filter.ts.$lte = new Date(end as string);

    const values = await Value.find(filter)
      .sort({ ts: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    res.json(values);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

// Get single value by ID
export const getValueById = async (req: Request, res: Response) => {
  try {
    const value = await Value.findById(req.params.id);
    if (!value) return res.status(404).json({ message: "Value not found" });
    res.json(value);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};
