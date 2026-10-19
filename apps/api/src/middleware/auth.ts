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

    // Support demo-token and custom-token for pilot/serverless testing
    if (token.startsWith('demo-token') || token.startsWith('custom-token-') || token === 'demo-token') {
      const demoRole = req.headers['x-demo-role'] as any || 'DONOR';
      const userId = token.startsWith('custom-token-') ? token.replace('custom-token-', '') : `demo-${demoRole.toLowerCase()}-user-1`;
      req.user = {
        id: userId,
        supabaseId: `supabase-${userId}`,
        email: `${demoRole.toLowerCase()}@mealbridge.org`,
        name: `User (${demoRole})`,
        role: demoRole,
        phone: '+91 98765 00000',
        isActive: true,
        emailVerified: true,
        avatarUrl: null,
        organizationId: `org-${userId}`,
        organization: {
          id: `org-${userId}`,
          name: demoRole === 'DONOR' ? 'Surplus Food Donor' : 'Hope Community Kitchen',
          type: demoRole === 'DONOR' ? 'RESTAURANT' : 'NGO',
          phone: '+91 98765 11223',
          email: `${demoRole.toLowerCase()}@mealbridge.org`,
          address: 'Civil Lines, Prayagraj',
          city: 'Prayagraj',
          state: 'UP',
          pinCode: '211001',
          verificationStatus: 'PENDING',
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

    let dbUser: any = null;
    try {
      dbUser = await prisma.user.findUnique({
        where: { supabaseId: data.user.id },
        include: {
          organizationMemberships: {
            include: {
              organization: true,
            },
          },
        },
      });
    } catch (_dbErr) {
      console.warn('Prisma lookup failed in auth middleware, falling back to session metadata');
    }

    if (!dbUser) {
      // Fallback: construct user from Supabase user_metadata or custom headers
      const meta = (data.user.user_metadata || {}) as Record<string, any>;
      const userRole = (req.headers['x-demo-role'] as any) || (meta.role as any) || (data.user.email?.includes('admin') ? 'ADMIN' : data.user.email?.includes('recipient') || data.user.email?.includes('ngo') ? 'RECIPIENT' : data.user.email?.includes('volunteer') ? 'VOLUNTEER' : 'DONOR');
      const userName = (req.headers['x-user-name'] as string) || meta.name || data.user.email?.split('@')[0] || 'User';
      const isOrg = userRole === 'DONOR' || userRole === 'RECIPIENT';
      const orgId = (req.headers['x-user-org-id'] as string) || meta.organizationId || (isOrg ? `org-${data.user.id.slice(0, 8)}` : null);

      const fallbackOrg = isOrg ? {
        id: orgId,
        name: (req.headers['x-user-org-name'] as string) || meta.organizationName || (userRole === 'DONOR' ? `${userName}'s Kitchen` : 'Community NGO Shelter'),
        type: meta.organizationType || (userRole === 'DONOR' ? 'RESTAURANT' : 'NGO'),
        phone: meta.phone || '+91 98765 00000',
        email: data.user.email || 'org@mealbridge.org',
        address: meta.organizationAddress || 'Commercial Area',
        city: meta.city || 'Prayagraj',
        state: meta.state || 'UP',
        pinCode: meta.pinCode || '211001',
        verificationStatus: meta.verificationStatus || 'PENDING',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } : null;

      req.user = {
        id: data.user.id,
        supabaseId: data.user.id,
        email: data.user.email || '',
        name: userName,
        role: userRole,
        phone: meta.phone || null,
        isActive: true,
        emailVerified: true,
        avatarUrl: null,
        organizationId: orgId,
        organization: fallbackOrg as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return next();
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

    // Support demo-token and custom-token for local pilot testing
    if (token.startsWith('demo-token') || token.startsWith('custom-token-') || token === 'demo-token') {
      const demoRole = (req.headers['x-demo-role'] as any) || 'DONOR';
      const userId = token.startsWith('custom-token-') ? token.replace('custom-token-', '') : `demo-${demoRole.toLowerCase()}-user-1`;
      const userEmail = (req.headers['x-user-email'] as string) || `${demoRole.toLowerCase()}@mealbridge.org`;
      const userName = (req.headers['x-user-name'] as string) || (token.startsWith('custom-token-') ? 'Registered User' : `User (${demoRole})`);
      const orgName = (req.headers['x-user-org-name'] as string) || (demoRole === 'DONOR' ? 'Surplus Food Donor' : 'Hope Community Kitchen');
      const orgId = (req.headers['x-user-org-id'] as string) || `org-${userId}`;

      req.user = {
        id: userId,
        supabaseId: `supabase-${userId}`,
        email: userEmail,
        name: userName,
        role: demoRole,
        phone: '+91 98765 00000',
        isActive: true,
        emailVerified: true,
        avatarUrl: null,
        organizationId: orgId,
        organization: {
          id: orgId,
          name: orgName,
          type: demoRole === 'DONOR' ? 'RESTAURANT' : 'NGO',
          phone: '+91 98765 11223',
          email: userEmail,
          address: 'Civil Lines, Prayagraj',
          city: 'Prayagraj',
          state: 'UP',
          pinCode: '211001',
          verificationStatus: 'PENDING',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return next();
    }

    const { data } = await supabaseAdmin.auth.getUser(token);
    if (!data.user) return next();

    let dbUser: any = null;
    try {
      dbUser = await prisma.user.findUnique({
        where: { supabaseId: data.user.id },
        include: {
          organizationMemberships: {
            include: {
              organization: true,
            },
          },
        },
      });
    } catch {
      // Ignored for optional auth
    }

    if (dbUser && dbUser.isActive) {
      const primaryMembership = dbUser.organizationMemberships[0];
      req.user = {
        ...dbUser,
        organizationId: primaryMembership?.organizationId ?? null,
        organization: primaryMembership?.organization ?? null,
      };
    } else if (data.user) {
      const meta = (data.user.user_metadata || {}) as Record<string, any>;
      const userRole = (req.headers['x-demo-role'] as any) || (meta.role as any) || 'DONOR';
      const userName = (req.headers['x-user-name'] as string) || meta.name || data.user.email?.split('@')[0] || 'User';
      const isOrg = userRole === 'DONOR' || userRole === 'RECIPIENT';
      const orgId = (req.headers['x-user-org-id'] as string) || meta.organizationId || (isOrg ? `org-${data.user.id.slice(0, 8)}` : null);

      req.user = {
        id: data.user.id,
        supabaseId: data.user.id,
        email: data.user.email || '',
        name: userName,
        role: userRole,
        phone: meta.phone || null,
        isActive: true,
        emailVerified: true,
        avatarUrl: null,
        organizationId: orgId,
        organization: isOrg ? {
          id: orgId,
          name: (req.headers['x-user-org-name'] as string) || meta.organizationName || 'Affiliated Organization',
          type: meta.organizationType || (userRole === 'DONOR' ? 'RESTAURANT' : 'NGO'),
          phone: meta.phone || '+91 98765 00000',
          email: data.user.email || '',
          address: meta.organizationAddress || 'Commercial Area',
          city: meta.city || 'Prayagraj',
          state: 'UP',
          pinCode: meta.pinCode || '211001',
          verificationStatus: 'PENDING',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    next();
  } catch {
    // Optional auth silently continues on token parsing failure
    next();
  }
}
