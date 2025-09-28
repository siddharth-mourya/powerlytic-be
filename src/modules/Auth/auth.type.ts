export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'CompanyAdmin' | 'OrgAdmin' | 'orgUser';
  organizationId?: string; // for OrgAdmin/User
}
