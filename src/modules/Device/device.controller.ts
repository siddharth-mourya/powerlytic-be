import { Request, Response } from "express";
import * as deviceService from "./device.service";

export const createDevice = async (req: Request, res: Response) => {
  try {
    const device = await deviceService.createDevice(req.body);
    res.status(201).json(device);
  } catch (err) {
    res.status(400).json({ error: "Unable to create the device" });
  }
};

export const getDevices = async (req: Request, res: Response) => {
  const devices = await deviceService.getDevices(req.query);
  res.json(devices);
};

export const getDeviceById = async (req: Request, res: Response) => {
  const device = await deviceService.getDeviceById(req.params.id);
  if (!device) return res.status(404).json({ error: "Device not found" });
  res.json(device);
};

export const updateDevice = async (req: Request, res: Response) => {
  try {
    const updated = await deviceService.updateDevice(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Unable to update the Device" });
  }
};

export const deleteDevice = async (req: Request, res: Response) => {
  try {
    await deviceService.deleteDevice(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: "Unable to delete the Device" });
  }
};
