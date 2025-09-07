import { Request, Response } from "express";
import { Organization } from "./Organization.model";
import { User } from "../User/User.model";
import { Device } from "../Device/Device.model";

// Create organization
export const createOrganization = async (req: Request, res: Response) => {
  try {
    const org = await Organization.create(req.body);
    res.status(201).json(org);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

// List all organizations
export const getOrganizations = async (req: Request, res: Response) => {
  try {
    const orgs = await Organization.find();
    res.json(orgs);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

// Get organization by ID with users & devices
export const getOrganizationById = async (req: Request, res: Response) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    const users = await User.find({ organization: org._id });
    const devices = await Device.find({ organizationId: org._id });

    res.json({ organization: org, users, devices });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

// Update organization
export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!org) return res.status(404).json({ message: "Organization not found" });
    res.json(org);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

// Delete organization
export const deleteOrganization = async (req: Request, res: Response) => {
  try {
    await Organization.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};
