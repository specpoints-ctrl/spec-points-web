import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const userRole = user.role || user.user_roles?.[0]?.role;

    if (!allowedRoles.includes(userRole)) {
      throw new AppError('Acesso negado', 403);
    }

    next();
  };
}
