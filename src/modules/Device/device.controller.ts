import { Request, Response } from 'express';
import * as deviceService from './device.service';
import { deploymentService } from './deployment.service';

export const createDevice = async (req: Request, res: Response) => {
  try {
    const device = await deviceService.createDevice(req.body);
    res.status(201).json(device);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Unable to create the device' });
  }
};

export const getDevices = async (req: Request, res: Response) => {
  const devices = await deviceService.getDevices(req.query);
  res.json(devices);
};

export const getDeviceById = async (req: Request, res: Response) => {
  const device = await deviceService.getDeviceById(req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });
  res.json(device);
};

export const getConfigByDeviceId = async (req: Request, res: Response) => {
  try {
    const config = await deviceService.getConfigByDeviceId(req.params.id);
    if (!config) return res.status(404).json({ error: 'Configuration not found for the Device' });
    res.json(config);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Unable to retrieve the Device configuration' });
  }
};

export const updateDevice = async (req: Request, res: Response) => {
  try {
    const updated = await deviceService.updateDevice(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Unable to update the Device' });
  }
};

export const deleteDevice = async (req: Request, res: Response) => {
  try {
    await deviceService.deleteDevice(req.params.id);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Unable to delete the Device' });
  }
};

// 🔹 Deployment endpoints
export const deployConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await deploymentService.deployConfig(id);
    res.status(201).json({
      message: 'Config deployment initiated',
      deployment: result,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Unable to deploy config' });
  }
};

export const getDeploymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const status = await deploymentService.getDeploymentStatus(id);
    res.json(status);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Unable to fetch deployment status' });
  }
};

export const updateDeploymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const result = await deploymentService.updateDeploymentStatus(id, payload);
    res.json({
      message: 'Deployment status updated',
      deployment: result,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Unable to update deployment status' });
  }
};

// export const getDeploymentHistory = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const history = await deploymentService.getDeploymentHistory(id);
//     res.json(history);
//   } catch (err: any) {
//     res.status(400).json({ error: err.message || 'Unable to fetch deployment history' });
//   }
// };
