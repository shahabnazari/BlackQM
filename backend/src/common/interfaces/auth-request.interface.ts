import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  tenantId?: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}