import type { CookieOptions, Request, RequestHandler, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { cleanText } from '../lib/sanitize.js';
import { env } from '../config/env.js';

const GUEST_COOKIE = 'guest_session_id';

function guestCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    signed: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: 365 * 24 * 60 * 60 * 1000,
    path: '/'
  };
}

export type BootstrapGuestInput = {
  nickname?: string | null;
  isAnonymous?: boolean;
};

export async function resolveGuestSession(req: Request, res: Response, input: BootstrapGuestInput = {}) {
  const cookieId = typeof req.signedCookies?.[GUEST_COOKIE] === 'string' ? req.signedCookies[GUEST_COOKIE] : null;
  const nickname = input.nickname ? cleanText(input.nickname).slice(0, 30) : undefined;
  const nextData = {
    ...(nickname !== undefined ? { nickname: nickname || null } : {}),
    ...(typeof input.isAnonymous === 'boolean' ? { isAnonymous: input.isAnonymous } : {}),
    lastSeenAt: new Date()
  };

  let guest = cookieId
    ? await prisma.guestSession.findUnique({
        where: { id: cookieId }
      })
    : null;

  if (guest) {
    guest = await prisma.guestSession.update({
      where: { id: guest.id },
      data: nextData
    });
  } else {
    guest = await prisma.guestSession.create({
      data: {
        nickname: nickname || null,
        isAnonymous: input.isAnonymous ?? true,
        lastSeenAt: new Date()
      }
    });
  }

  res.cookie(GUEST_COOKIE, guest.id, guestCookieOptions());
  return guest;
}

export const ensureGuest: RequestHandler = async (req, res, next) => {
  try {
    req.guestSession = await resolveGuestSession(req, res);
    next();
  } catch (error) {
    next(error);
  }
};
