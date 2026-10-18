import { User, Organization } from '@prisma/client';

export interface AuthenticatedUser extends User {
  organization?: Organization | null;
  organizationId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
