import { Response, NextFunction } from 'express';
import { AppError } from './error-handler.js';
import { AuthRequest } from './auth.js';

export function requireRole(allowedRoles: string[]) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user?.uid) {
        return next(new AppError('Usuário não autenticado', 401));
      }

      const { db } = await import('../db/config.js');

      const userRecord = await db.oneOrNone(
        `SELECT ur.role
         FROM user_roles ur
         JOIN users u ON u.id = ur.user_id
         WHERE u.firebase_uid = $1
         LIMIT 1`,
        [req.user.uid]
      );

      if (!userRecord) {
        return next(new AppError('Usuário sem role atribuído', 403));
      }

      if (!allowedRoles.includes(userRecord.role)) {
        return next(new AppError('Acesso negado', 403));
      }

      // Attach role to req.user for downstream use
      (req as any).user.role = userRecord.role;

      next();
    } catch (error) {
      next(error);
    }
  };
}
