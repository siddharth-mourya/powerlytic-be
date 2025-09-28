import mongoose, { Schema, Document } from 'mongoose';
import { IOrganization } from '../Organization/Organization.model';
import { UserRoles } from '../../utils/constants/user';

export type UserRole = keyof typeof UserRoles;

export interface IUser extends Document {
  email: string;
  password: string; // hashed
  name: string;
  role: UserRole;
  phone: string;
  organization?: IOrganization['_id'];
  isActive?: boolean;

  // Auth-related fields
  refreshTokens?: string[]; // hashed refresh tokens
  resetPasswordToken?: string; // hashed reset token
  resetPasswordExpires?: Date; // expiration time
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ['CompanyAdmin', 'OrgAdmin', 'orgUser'],
      default: 'orgUser',
    },
    organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },

    refreshTokens: [{ type: String }],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>('User', UserSchema);
