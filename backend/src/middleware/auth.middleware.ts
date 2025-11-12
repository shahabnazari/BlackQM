import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'secret') as any;
    (req as AuthRequest).user = {
      id: decoded.id || decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || 'user',
    };
    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAuth = authMiddleware;