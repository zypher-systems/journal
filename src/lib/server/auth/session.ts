import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, ne } from 'drizzle-orm';
import { db } from '$lib/db';
import { sessions, users, type User } from '$lib/db/schema';

const COOKIE_NAME = 'journal_session';
const SESSION_DAYS = 30;

export function cookieName(): string {
	return COOKIE_NAME;
}

export function sha256(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export function cookieOptions(expires: Date) {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: process.env.COOKIE_SECURE === 'true',
		expires
	};
}

export async function createSession(userId: string): Promise<{ token: string; expires: Date }> {
	const token = randomBytes(32).toString('base64url');
	const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
	await db.insert(sessions).values({ id: sha256(token), userId, expiresAt: expires });
	return { token, expires };
}

/**
 * Validate a session token. Returns the user (must be active) or null.
 * Slides the expiry forward when the session is past its midpoint.
 */
export async function validateSession(
	token: string | undefined
): Promise<{ user: User; expires: Date } | null> {
	if (!token || token.length > 128) return null;
	const id = sha256(token);
	const rows = await db
		.select({ user: users, session: sessions })
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
		.limit(1);

	const row = rows[0];
	if (!row || row.user.deactivated) return null;

	const half = row.session.expiresAt.getTime() - SESSION_DAYS * 864e5 / 2;
	let expires = row.session.expiresAt;
	if (Date.now() > half) {
		expires = new Date(Date.now() + SESSION_DAYS * 864e5);
		await db.update(sessions).set({ expiresAt: expires }).where(eq(sessions.id, id));
	}
	return { user: row.user, expires };
}

export async function destroySession(token: string | undefined): Promise<void> {
	if (!token) return;
	await db.delete(sessions).where(eq(sessions.id, sha256(token)));
}

/** End every session a user has, except the one behind `keepToken` when given. */
export async function destroyUserSessions(userId: string, keepToken?: string): Promise<void> {
	const mine = eq(sessions.userId, userId);
	await db.delete(sessions).where(keepToken ? and(mine, ne(sessions.id, sha256(keepToken))) : mine);
}
