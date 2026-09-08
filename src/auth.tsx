import {createHash, randomBytes, timingSafeEqual} from 'node:crypto';

import {Hono, type MiddlewareHandler} from 'hono';
import {deleteCookie, getCookie, setCookie} from 'hono/cookie';

import {CONFIG} from '#config';
import {logger} from './logger.ts';
import {LoginPage} from './pages/login/LoginPage.tsx';

const SESSION_LIFETIME_SECONDS = 12 * 60 * 60;
const SESSION_COOKIE = 'atlas_session';
const sessions = new Map<string, number>();

function cookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    maxAge: SESSION_LIFETIME_SECONDS,
    path: '/',
    sameSite: 'Strict',
    secure,
  } as const;
}

function isSecureRequest(requestUrl: string, forwardedProtocol: string | undefined): boolean {
  const proxyProtocol = forwardedProtocol?.split(',', 1)[0]?.trim().toLowerCase();
  if (proxyProtocol !== undefined && proxyProtocol !== '') {
    return proxyProtocol === 'https';
  }
  return new URL(requestUrl).protocol === 'https:';
}

function valuesMatch(actual: string, expected: string): boolean {
  const actualDigest = createHash('sha256').update(actual).digest();
  const expectedDigest = createHash('sha256').update(expected).digest();
  return timingSafeEqual(actualDigest, expectedDigest);
}

function credentialsMatch(username: string, password: string): boolean {
  const credentials = CONFIG.auth.credentials;
  return (
    credentials !== undefined &&
    valuesMatch(username, credentials.username) &&
    valuesMatch(password, credentials.password)
  );
}

function removeExpiredSessions(now: number) {
  for (const [id, expiresAt] of sessions) {
    if (expiresAt <= now) {
      sessions.delete(id);
    }
  }
}

function createSession(): string {
  const now = Date.now();
  removeExpiredSessions(now);
  const id = randomBytes(32).toString('base64url');
  sessions.set(id, now + SESSION_LIFETIME_SECONDS * 1000);
  return id;
}

function isAuthenticated(sessionId: string | undefined): boolean {
  if (!sessionId) {
    return false;
  }

  const expiresAt = sessions.get(sessionId);
  if (expiresAt === undefined) {
    return false;
  }
  if (expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return false;
  }
  return true;
}

function safeDestination(value: string | undefined): string {
  if (!value?.startsWith('/')) {
    return '/';
  }

  try {
    const baseUrl = new URL('http://atlas.local');
    const destination = new URL(value, baseUrl);
    if (destination.origin !== baseUrl.origin) {
      return '/';
    }
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return '/';
  }
}

function loginDestination(requestUrl: string): string {
  const url = new URL(requestUrl);
  return `/login?next=${encodeURIComponent(`${url.pathname}${url.search}`)}`;
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  c.header('Cache-Control', 'no-store');

  if (CONFIG.auth.bypass || c.req.path === '/login') {
    await next();
    return;
  }

  if (isAuthenticated(getCookie(c, SESSION_COOKIE))) {
    await next();
    return;
  }

  const destination = loginDestination(c.req.url);
  if (c.req.header('HX-Request') === 'true') {
    c.header('HX-Redirect', destination);
    return c.text('Authentication required', 401);
  }
  if (c.req.path.startsWith('/api/')) {
    return c.json({error: 'Authentication required'}, 401);
  }
  if (c.req.method === 'GET' || c.req.method === 'HEAD') {
    return c.redirect(destination, 303);
  }
  return c.text('Authentication required', 401);
};

export function registerAuthRoutes(app: Hono) {
  app.get('/login', (c) => {
    if (!CONFIG.auth.bypass && isAuthenticated(getCookie(c, SESSION_COOKIE))) {
      return c.redirect(safeDestination(c.req.query('next')), 303);
    }
    return c.html(<LoginPage next={safeDestination(c.req.query('next'))} />);
  });

  app.post('/login', async (c) => {
    const body = await c.req.parseBody();
    const username = typeof body.username === 'string' ? body.username : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const next = safeDestination(typeof body.next === 'string' ? body.next : undefined);

    if (!credentialsMatch(username, password)) {
      logger.warn('Login rejected');
      await new Promise((resolve) => setTimeout(resolve, 750));
      return c.html(<LoginPage error="Invalid username or password" next={next} />, 401);
    }

    const secureCookie = isSecureRequest(c.req.url, c.req.header('X-Forwarded-Proto'));
    setCookie(c, SESSION_COOKIE, createSession(), cookieOptions(secureCookie));
    logger.info({secureCookie}, 'Login succeeded');
    return c.redirect(next, 303);
  });

  app.post('/logout', (c) => {
    const sessionId = getCookie(c, SESSION_COOKIE);
    if (sessionId) {
      sessions.delete(sessionId);
    }
    const secureCookie = isSecureRequest(c.req.url, c.req.header('X-Forwarded-Proto'));
    deleteCookie(c, SESSION_COOKIE, {path: '/', secure: secureCookie});
    logger.info('Logged out');
    return c.redirect('/login', 303);
  });
}
