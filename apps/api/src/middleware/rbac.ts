import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from './error-handler';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          403,
          'FORBIDDEN',
          `Access forbidden: required role ${allowedRoles.join(' or ')} but current user is ${req.user.role}`
        )
      );
    }

    next();
  };
}

export function requireOrganization(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
  }

  if (!req.user.organizationId) {
    return next(
      new AppError(
        400,
        'ORGANIZATION_REQUIRED',
        'User is not affiliated with any registered organization'
      )
    );
  }

  next();
}

export function requireVerifiedOrganization(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
  }

  if (!req.user.organization) {
    return next(
      new AppError(
        400,
        'ORGANIZATION_REQUIRED',
        'User is not affiliated with an organization'
      )
    );
  }

  if (req.user.organization.verificationStatus !== 'VERIFIED') {
    return next(
      new AppError(
        403,
        'ORGANIZATION_NOT_VERIFIED',
        `Organization verification is currently ${req.user.organization.verificationStatus}. Operational access requires verified status.`
      )
    );
  }

  next();
}
