import type { GuestSession } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      guestSession?: GuestSession;
      adminSessionId?: string;
    }
  }
}

export {};
