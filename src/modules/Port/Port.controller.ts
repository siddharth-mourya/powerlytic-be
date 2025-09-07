import { Request, Response } from "express";
import { Port } from "./Port.model";

export const createPort = async (req: Request, res: Response) => {
  const port = await Port.create(req.body);
  res.status(201).json(port);
};

export const getPorts = async (req: Request, res: Response) => {
  const ports = await Port.find().populate("portTypeId").populate("deviceId");
  res.json(ports);
};

export const getPortById = async (req: Request, res: Response) => {
  const port = await Port.findById(req.params.id).populate("portTypeId").populate("deviceId");
  res.json(port);
};

export const updatePort = async (req: Request, res: Response) => {
  const port = await Port.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(port);
};

export const deletePort = async (req: Request, res: Response) => {
  await Port.findByIdAndDelete(req.params.id);
  res.status(204).send();
};
