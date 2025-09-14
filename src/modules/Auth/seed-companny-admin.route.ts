// seedAdmin.ts (run once at startup)
import bcrypt from 'bcrypt';
import { User } from '../User/User.model';
import { UserRoles } from '../../utils/constants/user';

export async function seedAdmin() {
  // check if a CompanyAdmin already exists
  const existing = await User.findOne({ role: UserRoles.CompanyAdmin });
  if (!existing) {
    const hashed = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD!, 10);
    await User.create({
      email: process.env.DEFAULT_ADMIN_EMAIL,
      password: hashed,
      phone: '0000000000',
      role: UserRoles.CompanyAdmin,
      name: 'Default Admin',
    });
    console.log('✅ CompanyAdmin seeded!');
  }
}
