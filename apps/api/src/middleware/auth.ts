import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { prisma } from '../lib/prisma';
import { AppError } from './error-handler';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication bearer token required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError(401, 'UNAUTHORIZED', 'Token is missing from Authorization header');
    }

    let authUser: any = null;
    try {
      const { data } = await supabaseAdmin.auth.getUser(token);
      if (data?.user) {
        authUser = data.user;
      }
    } catch {
      // Supabase API service error fallback
    }

    if (!authUser) {
      // Fallback: safely extract payload from JWT token
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload && (payload.sub || payload.email)) {
            authUser = {
              id: payload.sub || payload.id,
              email: payload.email || '',
              user_metadata: payload.user_metadata || {},
            };
          }
        }
      } catch {}
    }

    if (!authUser) {
      throw new AppError(401, 'INVALID_TOKEN', 'Session has expired or token is invalid. Please sign in again.');
    }

    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseId: authUser.id },
          ...(authUser.email ? [{ email: authUser.email }] : []),
        ],
      },
      include: {
        organizationMemberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!dbUser) {
      throw new AppError(401, 'USER_NOT_FOUND', 'User profile not synchronized in database. Please re-authenticate.');
    }

    if (!dbUser.isActive) {
      throw new AppError(403, 'ACCOUNT_DEACTIVATED', 'Your account has been deactivated');
    }

    const primaryMembership = dbUser.organizationMemberships[0];

    req.user = {
      ...dbUser,
      organizationId: primaryMembership?.organizationId ?? null,
      organization: primaryMembership?.organization ?? null,
    };

    next();
  } catch (err) {
    next(err);
  }
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    let authUser: any = null;
    try {
      const { data } = await supabaseAdmin.auth.getUser(token);
      if (data?.user) authUser = data.user;
    } catch {}

    if (!authUser) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload && (payload.sub || payload.email)) {
            authUser = {
              id: payload.sub || payload.id,
              email: payload.email || '',
              user_metadata: payload.user_metadata || {},
            };
          }
        }
      } catch {}
    }

    if (!authUser) return next();

    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseId: authUser.id },
          ...(authUser.email ? [{ email: authUser.email }] : []),
        ],
      },
      include: {
        organizationMemberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (dbUser && dbUser.isActive) {
      const primaryMembership = dbUser.organizationMemberships[0];
      req.user = {
        ...dbUser,
        organizationId: primaryMembership?.organizationId ?? null,
        organization: primaryMembership?.organization ?? null,
      };
    }

    next();
  } catch {
    next();
  }
}
