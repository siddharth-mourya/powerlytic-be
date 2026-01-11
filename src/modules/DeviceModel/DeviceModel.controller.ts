import { Request, Response } from 'express';
import { DeviceModel, IDeviceModel, PortInfo } from './DeviceModel.model';
import { PortType } from '../PortType/PortType.model';
const mongoose = require('mongoose');

export const createDeviceModel = async (req: Request, res: Response) => {
  // Add request transformation to add portKey on the field of porttype refering to PortTypeSchema _id and count like AI_1, AI_2 etc.

  let model = req.body;

  if (Array.isArray(model?.ports) && model.ports.length > 0) {
    const counts: Record<string, number> = {};

    // Use for...of instead of forEach to properly await async operations
    for (let index = 0; index < model.ports.length; index++) {
      const port = model.ports[index];
      const portTypeId = port.portType;
      const base = String(portTypeId);

      const count = (counts[base] || 0) + 1;
      counts[base] = count;

      const doc = await PortType.findById(portTypeId)
        .select('codeName')
        .lean()
        .then((pt) => pt?.codeName);

      model.ports[index].portKey = `${doc ? doc : 'Unknown'}_${count}`;
    }

    // Now the model is fully transformed, then respond
    await DeviceModel.create(model);
    res.status(201).json({ model });
    return;
  }
  res.status(500).json({ error: 'PortType IDs are required to create portKeys' });
};

export const getDeviceModels = async (_: Request, res: Response) => {
  const models = await DeviceModel.find().populate('ports.portType');
  res.json(models);
};

export const getDeviceModelById = async (req: Request, res: Response) => {
  const model = await DeviceModel.findById(req.params.id).populate('ports.portType');
  res.json(model);
};

export const updateDeviceModel = async (req: Request, res: Response) => {
  const model = await DeviceModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(model);
};

export const deleteDeviceModel = async (req: Request, res: Response) => {
  await DeviceModel.findByIdAndDelete(req.params.id);
  res.status(204).send();
};
