import { Request, Response } from "express";
import { PortType } from "./PortType.model";

export const createPortType = async (req: Request, res: Response) => {
  const portType = await PortType.create(req.body);
  res.status(201).json(portType);
};

export const getPortTypes = async (req: Request, res: Response) => {
  const types = await PortType.find();
  res.json(types);
};

export const getPortTypeById = async (req: Request, res: Response) => {
  const type = await PortType.findById(req.params.id);
  res.json(type);
};

export const updatePortType = async (req: Request, res: Response) => {
  const type = await PortType.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(type);
};

export const deletePortType = async (req: Request, res: Response) => {
  await PortType.findByIdAndDelete(req.params.id);
  res.status(204).send();
};
