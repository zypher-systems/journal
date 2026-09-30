import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/db';
import { entries, users } from '$lib/db/schema';
import { hashPassword, validatePasswordStrength } from '$lib/server/auth/password';
import { destroyUserSessions } from '$lib/server/auth/session';

/** Actions run without the page load, so each one checks the role itself. */
function requireAdmin(locals: App.Locals) {
	if (locals.user?.role !== 'admin') error(403, 'Admins only');
}

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user!.role !== 'admin') redirect(302, '/');
	const list = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			deactivated: users.deactivated,
			createdAt: users.createdAt,
			entryCount: sql<number>`(select count(*)::int from ${entries} where ${entries.userId} = ${users.id})`
		})
		.from(users)
		.orderBy(asc(users.createdAt));
	return { users: list };
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim().slice(0, 80);
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const password = String(form.get('password') ?? '');
		const role = form.get('role') === 'admin' ? 'admin' : 'member';

		if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
			return fail(400, { error: 'A name and a valid email are needed.', section: 'create' });
		}
		const problem = validatePasswordStrength(password);
		if (problem) return fail(400, { error: problem, section: 'create' });

		const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
		if (existing.length > 0) {
			return fail(409, { error: 'That email already has an account.', section: 'create' });
		}

		await db.insert(users).values({
			name,
			email,
			role,
			passwordHash: await hashPassword(password)
		});
		return { success: true, section: 'create' };
	},

	toggle: async ({ locals, request }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
		if (!user) return fail(404, { error: 'No such user.', section: 'toggle' });
		if (user.id === locals.user!.id) {
			return fail(400, { error: 'You can’t deactivate yourself.', section: 'toggle' });
		}
		await db.update(users).set({ deactivated: !user.deactivated }).where(eq(users.id, id));
		return { success: true, section: 'toggle' };
	},

	reset: async ({ locals, request }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const password = String(form.get('password') ?? '');
		const problem = validatePasswordStrength(password);
		if (problem) return fail(400, { error: problem, section: 'reset' });
		await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, id));
		// Sign the account out everywhere so the old password's sessions die with it.
		await destroyUserSessions(id);
		return { success: true, section: 'reset' };
	}
};
