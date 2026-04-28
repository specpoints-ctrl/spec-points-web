import { Request, Response } from 'express';
import { db } from '../db/config.js';
import { createFirebaseUser, deleteFirebaseUser } from '../middleware/auth.js';
import { logger } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';

// Register new user (with extended profile fields)
export const register = async (req: Request, res: Response) => {
  try {
    const {
      email, password, role = 'architect',
      // Architect fields
      name, document_ci, ruc, company, telefone, office_phone, address, city, state, birthday,
      // Lojista (store) fields
      store_name, cnpj, owner_name, owner_ci, store_ruc, store_phone, store_office_phone,
      store_address, store_city, owner_birthday,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email e senha são obrigatórios' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Senha deve ter no mínimo 8 caracteres' });
    }

    // Name required for architect; store_name required for lojista
    if (role === 'architect' && !name) {
      return res.status(400).json({ success: false, error: 'Nome completo é obrigatório' });
    }
    if (role === 'lojista' && !store_name) {
      return res.status(400).json({ success: false, error: 'Nome da loja é obrigatório' });
    }

    const existingUser = await db.oneOrNone('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email já está em uso' });
    }

    const firebaseUser = await createFirebaseUser(email, password);

    try {
      const user = await db.one(
        `INSERT INTO users (firebase_uid, email, email_verified, status)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [firebaseUser.uid, email, false, 'pending']
      );

      let relatedId: number | null = null;

      if (role === 'architect') {
        // Determine if profile is complete based on required fields
        const profileComplete = !!(document_ci && company && ruc && telefone && birthday);

        const architect = await db.one(
          `INSERT INTO architects (
            name, email, status,
            document_ci, ruc, company, telefone, office_phone,
            address, city, state, birthday, profile_complete
          )
          VALUES ($1,$2,'pending',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
          RETURNING id`,
          [
            name, email,
            document_ci || null, ruc || null, company || null, telefone || null,
            office_phone || null, address || null, city || null, state || null,
            birthday || null, profileComplete,
          ]
        );
        relatedId = architect.id;

        await db.none(
          `INSERT INTO user_roles (user_id, role, architect_id, store_id) VALUES ($1, $2, $3, NULL)`,
          [user.id, 'architect', relatedId]
        );
      } else if (role === 'lojista') {
        // Lojista: create a stores record
        const profileComplete = !!(owner_name && owner_ci && store_ruc && store_phone && owner_birthday);

        // cnpj is required uniquely; use email as fallback identifier
        const effectiveCnpj = cnpj || `TEMP-${Date.now()}`;

        const store = await db.one(
          `INSERT INTO stores (
            name, cnpj, email, status,
            owner_name, owner_ci, ruc, phone, office_phone,
            address, city, owner_birthday, profile_complete
          )
          VALUES ($1,$2,$3,'pending',$4,$5,$6,$7,$8,$9,$10,$11,$12)
          RETURNING id`,
          [
            store_name, effectiveCnpj, email,
            owner_name || null, owner_ci || null, store_ruc || null,
            store_phone || null, store_office_phone || null,
            store_address || null, store_city || null,
            owner_birthday || null, profileComplete,
          ]
        );
        relatedId = store.id;

        await db.none(
          `INSERT INTO user_roles (user_id, role, architect_id, store_id) VALUES ($1, $2, NULL, $3)`,
          [user.id, 'lojista', relatedId]
        );
      } else {
        // Unknown role fallback
        await db.none(
          `INSERT INTO user_roles (user_id, role, architect_id, store_id) VALUES ($1, $2, NULL, NULL)`,
          [user.id, role]
        );
      }

      await db.none(
        `INSERT INTO security_audit_log (user_id, action, resource) VALUES ($1, 'USER_REGISTER', $2)`,
        [user.id, `User ${email} registered with role ${role}`]
      );

      logger.info(`New user registered: ${email} (${role})`);

      res.status(201).json({
        success: true,
        message: 'Cadastro realizado com sucesso. Aguardando aprovação.',
        data: { uid: firebaseUser.uid, email: user.email, status: user.status },
      });
    } catch (dbError: any) {
      // DB failed after Firebase user was created — roll back Firebase to avoid orphaned accounts
      logger.warn(`DB error after Firebase user creation for ${email}, rolling back Firebase user ${firebaseUser.uid}`);
      await deleteFirebaseUser(firebaseUser.uid).catch((rollbackErr) => {
        logger.error('Failed to rollback Firebase user:', rollbackErr);
      });
      throw dbError;
    }
  } catch (error: any) {
    logger.error('Registration error:', error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ success: false, error: 'Email já está em uso' });
    }
    res.status(500).json({ success: false, error: 'Erro ao realizar cadastro' });
  }
};

// Complete profile after registration (for Google sign-in users or incomplete registrations)
export const completeProfile = async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    if (!uid) throw new AppError('Não autenticado', 401);

    const userRole = await db.oneOrNone(
      `SELECT ur.role, ur.architect_id, ur.store_id
       FROM user_roles ur
       JOIN users u ON u.id = ur.user_id
       WHERE u.firebase_uid = $1`,
      [uid]
    );

    if (!userRole) throw new AppError('Perfil de usuário não encontrado', 404);

    if (userRole.role === 'architect' && userRole.architect_id) {
      const {
        name, document_ci, ruc, company, telefone, office_phone,
        address, city, state, birthday,
      } = req.body;

      const profileComplete = !!(document_ci && company && ruc && telefone && birthday);

      const architect = await db.oneOrNone(
        `UPDATE architects SET
          name = COALESCE($1, name),
          document_ci = COALESCE($2, document_ci),
          ruc = COALESCE($3, ruc),
          company = COALESCE($4, company),
          telefone = COALESCE($5, telefone),
          office_phone = COALESCE($6, office_phone),
          address = COALESCE($7, address),
          city = COALESCE($8, city),
          state = COALESCE($9, state),
          birthday = COALESCE($10, birthday),
          profile_complete = $11,
          updated_at = NOW()
        WHERE id = $12
        RETURNING *`,
        [
          name || null, document_ci || null, ruc || null, company || null,
          telefone || null, office_phone || null, address || null,
          city || null, state || null, birthday || null,
          profileComplete, userRole.architect_id,
        ]
      );

      if (!architect) throw new AppError('Arquiteto não encontrado', 404);

      return res.json({ success: true, data: architect, message: 'Perfil atualizado com sucesso' });

    } else if (userRole.role === 'lojista' && userRole.store_id) {
      const {
        store_name, cnpj, owner_name, owner_ci, store_ruc,
        store_phone, store_office_phone, store_address, store_city, owner_birthday,
      } = req.body;

      const profileComplete = !!(owner_name && owner_ci && store_ruc && store_phone && owner_birthday);

      const store = await db.oneOrNone(
        `UPDATE stores SET
          name = COALESCE($1, name),
          cnpj = COALESCE($2, cnpj),
          owner_name = COALESCE($3, owner_name),
          owner_ci = COALESCE($4, owner_ci),
          ruc = COALESCE($5, ruc),
          phone = COALESCE($6, phone),
          office_phone = COALESCE($7, office_phone),
          address = COALESCE($8, address),
          city = COALESCE($9, city),
          owner_birthday = COALESCE($10, owner_birthday),
          profile_complete = $11,
          updated_at = NOW()
        WHERE id = $12
        RETURNING *`,
        [
          store_name || null, cnpj || null, owner_name || null, owner_ci || null,
          store_ruc || null, store_phone || null, store_office_phone || null,
          store_address || null, store_city || null, owner_birthday || null,
          profileComplete, userRole.store_id,
        ]
      );

      if (!store) throw new AppError('Loja não encontrada', 404);

      return res.json({ success: true, data: store, message: 'Perfil atualizado com sucesso' });
    }

    throw new AppError('Role inválido para completar perfil', 400);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao completar perfil', 500, error);
  }
};

// Login user (verify rate limiting)
export const login = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email é obrigatório' });
    }

    const recentAttempts = await db.oneOrNone(
      `SELECT COUNT(*) as count FROM login_attempts
       WHERE email = $1 AND success = false AND created_at > NOW() - INTERVAL '15 minutes'`,
      [email]
    );

    if (recentAttempts && parseInt(recentAttempts.count) >= 5) {
      return res.status(429).json({
        success: false,
        error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      });
    }

    const user = await db.oneOrNone(
      'SELECT id, firebase_uid, email, status FROM users WHERE email = $1',
      [email]
    );

    if (!user) {
      await db.none('INSERT INTO login_attempts (email, success, ip_address) VALUES ($1, false, $2)', [email, ipAddress]);
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, error: 'Conta bloqueada. Entre em contato com o suporte.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ success: false, error: 'Conta aguardando aprovação.' });
    }

    const userRole = await db.oneOrNone(
      'SELECT role, architect_id, store_id FROM user_roles WHERE user_id = $1',
      [user.id]
    );

    await db.none('INSERT INTO login_attempts (email, success, ip_address) VALUES ($1, true, $2)', [email, ipAddress]);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      data: {
        user: { id: user.id, firebase_uid: user.firebase_uid, email: user.email, status: user.status },
        role: userRole,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Erro ao processar login' });
  }
};

// Get current user info
export const getCurrentUser = async (req: any, res: Response) => {
  try {
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }

    const user = await db.oneOrNone(
      `SELECT u.id, u.firebase_uid, u.email, u.display_name, u.avatar_url, u.status, u.created_at,
              ur.role, ur.architect_id, ur.store_id
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       WHERE u.firebase_uid = $1`,
      [firebaseUid]
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar usuário' });
  }
};

// Cleanup old login attempts (can be called periodically)
export const cleanupLoginAttempts = async () => {
  try {
    const result = await db.result(`DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL '1 day'`);
    logger.info(`Cleaned up ${result.rowCount} old login attempts`);
  } catch (error) {
    logger.error('Cleanup login attempts error:', error);
  }
};

// Google Sign-In upsert
export const googleLogin = async (req: any, res: Response) => {
  try {
    const firebaseUid = req.user?.uid;
    const email = req.user?.email;

    if (!firebaseUid || !email) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }

    let user = await db.oneOrNone(
      `SELECT u.id, u.firebase_uid, u.email, u.status,
              ur.role, ur.architect_id, ur.store_id
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       WHERE u.firebase_uid = $1 OR u.email = $2
       LIMIT 1`,
      [firebaseUid, email]
    );

    if (user) {
      if (user.firebase_uid !== firebaseUid) {
        await db.none('UPDATE users SET firebase_uid = $1 WHERE id = $2', [firebaseUid, user.id]);
      }
      if (user.status === 'blocked') {
        return res.status(403).json({ success: false, error: 'Conta bloqueada. Entre em contato com o suporte.' });
      }
      return res.json({ success: true, data: { status: user.status, role: user.role } });
    }

    const displayName: string = req.body?.name || email.split('@')[0];

    const newUser = await db.one(
      `INSERT INTO users (firebase_uid, email, email_verified, status) VALUES ($1, $2, true, 'pending') RETURNING id, status`,
      [firebaseUid, email]
    );

    const architect = await db.one(
      `INSERT INTO architects (name, email, status, profile_complete) VALUES ($1, $2, 'pending', false) RETURNING id`,
      [displayName, email]
    );

    await db.none(
      `INSERT INTO user_roles (user_id, role, architect_id, store_id) VALUES ($1, 'architect', $2, NULL)`,
      [newUser.id, architect.id]
    );

    await db.none(
      `INSERT INTO security_audit_log (user_id, action, resource) VALUES ($1, 'USER_REGISTER', $2)`,
      [newUser.id, `Google user ${email} auto-registered`]
    );

    logger.info(`New Google user auto-registered: ${email}`);

    res.status(201).json({ success: true, data: { status: 'pending', role: 'architect' } });
  } catch (error) {
    logger.error('Google login error:', error);
    res.status(500).json({ success: false, error: 'Erro ao processar login Google' });
  }
};
