import { Request, Response } from 'express';
import { User } from './User.model';
import { Organization } from '../Organization/Organization.model';
import { UserService } from './user.service';

// Create user
export const createUser = async (req: Request, res: Response) => {
  try {
    const org = await Organization.findById(req.body.organization);
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

export const registerCompanyAdmin = async (req: Request, res: Response) => {
  try {
    const user = await UserService.registerCompanyAdmin(req.body);
    res.status(201).json({ user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Company admin registers an organization and initial OrgAdmin
export const registerOrganizationAndAdmin = async (req: Request, res: Response) => {
  try {
    const { orgData, adminUser } = req.body;
    const result = await UserService.registerOrganizationAndAdmin({ orgData, adminUser });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// OrgAdmin (or CompanyAdmin) registers an org user
export const registerOrgUser = async (req: Request, res: Response) => {
  try {
    const user = await UserService.registerOrgUser(req.body);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// List users with optional org filter
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().populate('organization');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

// List users with optional org filter
export const getUsersInOrg = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ organization: req.params.orgID }).populate('organization');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).populate('organization');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(
      'organization',
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};
