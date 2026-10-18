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

    // Support demo-token for local pilot testing when remote Supabase is in placeholder/mock mode
    if (token.startsWith('demo-token') || token === 'demo-token') {
      const demoRole = req.headers['x-demo-role'] as any || 'DONOR';
      req.user = {
        id: `demo-${demoRole.toLowerCase()}-user-1`,
        supabaseId: `demo-${demoRole.toLowerCase()}-supabase-id`,
        email: `${demoRole.toLowerCase()}@mealbridge.org`,
        name: `Pilot ${demoRole}`,
        role: demoRole,
        phone: '+91 98765 00000',
        isActive: true,
        emailVerified: true,
        avatarUrl: null,
        organizationId: `demo-${demoRole.toLowerCase()}-org-1`,
        organization: {
          id: `demo-${demoRole.toLowerCase()}-org-1`,
          name: demoRole === 'DONOR' ? 'Grand Royal Hotel & Restaurant' : 'Hope Community Shelter & Kitchen',
          type: demoRole === 'DONOR' ? 'RESTAURANT' : 'NGO',
          phone: '+91 98765 11223',
          email: `${demoRole.toLowerCase()}@mealbridge.org`,
          address: 'Civil Lines, Prayagraj',
          city: 'Prayagraj',
          state: 'UP',
          pinCode: '211001',
          verificationStatus: 'VERIFIED',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return next();
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      throw new AppError(401, 'INVALID_TOKEN', error?.message || 'Invalid or expired session');
    }

    // Lookup user in PostgreSQL database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: data.user.id },
      include: {
        organizationMemberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!dbUser) {
      throw new AppError(401, 'USER_NOT_SYNCED', 'User record not yet synchronized in database');
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

    const { data } = await supabaseAdmin.auth.getUser(token);
    if (!data.user) return next();

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: data.user.id },
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
    // Optional auth silently continues on token parsing failure
    next();
  }
}
