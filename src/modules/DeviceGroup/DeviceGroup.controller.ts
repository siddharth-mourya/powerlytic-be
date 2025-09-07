import { Request, Response } from "express";
import { DeviceGroup } from "./DeviceGroup.model";

// Create Device Group
export const createDeviceGroup = async (req: Request, res: Response) => {
  try {
    const group = await DeviceGroup.create(req.body);
    res.status(201).json(group);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

// Get all Device Groups
export const getDeviceGroups = async (req: Request, res: Response) => {
  try {
    const groups = await DeviceGroup.find().populate("devices");
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

// Get Device Group by ID
export const getDeviceGroupById = async (req: Request, res: Response) => {
  try {
    const group = await DeviceGroup.findById(req.params.id).populate("devices");
    if (!group) return res.status(404).json({ message: "DeviceGroup not found" });
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

// Update Device Group
export const updateDeviceGroup = async (req: Request, res: Response) => {
  try {
    const group = await DeviceGroup.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("devices");
    if (!group) return res.status(404).json({ message: "DeviceGroup not found" });
    res.json(group);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

// Delete Device Group
export const deleteDeviceGroup = async (req: Request, res: Response) => {
  try {
    await DeviceGroup.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};
