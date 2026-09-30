import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { eq } from 'drizzle-orm';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { verifyPassword } from '$lib/server/auth/password';
import { cookieName, cookieOptions, createSession } from '$lib/server/auth/session';
import { clearAccount, isThrottled, recordFailure } from '$lib/server/auth/throttle';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) redirect(302, '/');
	return {
		redirectTo: url.searchParams.get('redirectTo') ?? '/'
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const password = String(form.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { error: 'Please enter your email and password.', email });
		}

		const address = getClientAddress();
		if (isThrottled(email, address)) {
			return fail(429, { error: 'Too many tries. Give it a few minutes, then try again.', email });
		}

		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		// Always run an Argon2 compare, even for unknown emails, to resist timing probes.
		let ok = false;
		if (user && !user.deactivated) {
			ok = await verifyPassword(password, user.passwordHash);
		} else {
			await verifyPassword(password, DUMMY_HASH);
		}

		if (!ok) {
			recordFailure(email, address);
			return fail(401, { error: 'That email and password don’t match.', email });
		}
		clearAccount(email);

		const { token, expires } = await createSession(user.id);
		cookies.set(cookieName(), token, cookieOptions(expires));

		redirect(302, sameSitePath(String(form.get('redirectTo') ?? '/'), url.origin));
	}
};

/**
 * Resolve the target the way a browser would and keep it only if it stays on
 * this site, so '//host', '/\host' and friends can't send someone elsewhere.
 */
function sameSitePath(target: string, origin: string): string {
	try {
		const resolved = new URL(target, origin);
		if (resolved.origin === origin) return resolved.pathname + resolved.search + resolved.hash;
	} catch {
		/* not a URL at all */
	}
	return '/';
}

// Argon2 hash of a random string — used to equalize timing for unknown emails.
const DUMMY_HASH =
	'$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQ$RPMBkRQfA5qEhM7FnOZ2wGzS8N0vBQe1lVhkS7ahq3k';
