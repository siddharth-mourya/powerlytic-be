import { Request, Response } from 'express';
import { DeviceModel } from './DeviceModel.model';

// Create
export const createDeviceModel = async (req: Request, res: Response) => {
  const model = await DeviceModel.create(req.body);
  res.status(201).json(model);
};

// List with optional filters
export const getDeviceModels = async (req: Request, res: Response) => {
  const models = await DeviceModel.find().populate('ports.portType');
  res.json(models);
};

// Get one
export const getDeviceModelById = async (req: Request, res: Response) => {
  const model = await DeviceModel.findById(req.params.id).populate('ports.portType');
  res.json(model);
};

// Update
export const updateDeviceModel = async (req: Request, res: Response) => {
  const model = await DeviceModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(model);
};

// Delete
export const deleteDeviceModel = async (req: Request, res: Response) => {
  await DeviceModel.findByIdAndDelete(req.params.id);
  res.status(204).send();
};
