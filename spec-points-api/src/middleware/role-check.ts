import { Response, NextFunction } from 'express';
import { AppError } from './error-handler.js';
import { AuthRequest, loadUserContext } from './auth.js';

export function requireRole(allowedRoles: string[]) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user?.uid) {
        return next(new AppError('Usuário não autenticado', 401));
      }

      const userRecord = await loadUserContext(req);

      if (!userRecord) {
        return next(new AppError('Usuário sem role atribuído', 403));
      }

      if (!userRecord.role || !allowedRoles.includes(userRecord.role)) {
        return next(new AppError('Acesso negado', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
