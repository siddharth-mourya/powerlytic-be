import bcrypt from 'bcrypt';
import { Organization } from '../Organization/Organization.model';
import { User } from '../User/User.model';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

export class UserService {
  // Company admin registration (manufacturer)
  static async registerCompanyAdmin(payload: { email: string; password: string; name: string }) {
    const exists = await User.findOne({ email: payload.email });
    if (exists) throw new Error('Email already registered');

    const hashed = await bcrypt.hash(payload.password, BCRYPT_ROUNDS);

    const user = await User.create({
      email: payload.email,
      password: hashed,
      name: payload.name,
      role: 'CompanyAdmin',
      // company-level users may have no organization
    });

    // do not return password
    user.password = undefined as any;
    return user;
  }

  // Create org + first OrgAdmin (called by CompanyAdmin)
  static async registerOrganizationAndAdmin(orgPayload: {
    orgData: { name: string; orgPhone: string; address: string; orgEmail: string };
    adminUser: { email: string; password: string; name: string; phone: string };
    creatorUserId?: string;
  }) {
    const { orgData, adminUser } = orgPayload;

    const orgExisted = await Organization.findOne({ orgEmail: orgData.orgEmail });
    // create org if it not existed before
    let org = orgExisted ?? null;
    if (!orgExisted) {
      org = await Organization.create(orgData);
    }

    // create org admin user
    const hashed = await bcrypt.hash(adminUser.password, BCRYPT_ROUNDS);

    const existedUser = await User.findOne({ email: adminUser.email, phone: adminUser.phone });
    if (existedUser) {
      existedUser.password = undefined as any;
      return { organization: org, message: 'User already existed with this email or phone' };
    }
    const user = await User.create({
      email: adminUser.email,
      password: hashed,
      name: adminUser.name,
      role: 'OrgAdmin',
      phone: adminUser.phone,
      organization: org?._id,
    });

    user.password = undefined as any;
    return { organization: org, orgAdmin: user };
  }

  // Create user inside an org (by OrgAdmin)
  static async registerOrgUser(payload: {
    email: string;
    password: string;
    name: string;
    role: 'OrgAdmin' | 'Operator' | 'Viewer';
    organizationId: string;
  }) {
    const exists = await User.findOne({ email: payload.email });
    if (exists) throw new Error('Email already registered');

    const org = await Organization.findById(payload.organizationId);
    if (!org) throw new Error('Organization not found');

    const hashed = await bcrypt.hash(payload.password, BCRYPT_ROUNDS);
    const user = await User.create({
      email: payload.email,
      password: hashed,
      name: payload.name,
      role: payload.role,
      organization: payload.organizationId,
    });

    user.password = undefined as any;
    return user;
  }
}
