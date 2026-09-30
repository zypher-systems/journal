import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { eq } from 'drizzle-orm';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { hashPassword, validatePasswordStrength, verifyPassword } from '$lib/server/auth/password';
import { cookieName, destroyUserSessions } from '$lib/server/auth/session';

export const load: PageServerLoad = async ({ locals }) => {
	return { user: { name: locals.user!.name, email: locals.user!.email, themePreference: locals.user!.themePreference } };
};

export const actions: Actions = {
	profile: async ({ locals, request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim().slice(0, 80);
		if (!name) return fail(400, { error: 'Name can’t be empty.', section: 'profile' });
		await db.update(users).set({ name }).where(eq(users.id, locals.user!.id));
		return { success: true, section: 'profile' };
	},

	password: async ({ locals, request, cookies }) => {
		const form = await request.formData();
		const current = String(form.get('current') ?? '');
		const next = String(form.get('next') ?? '');

		const [user] = await db.select().from(users).where(eq(users.id, locals.user!.id)).limit(1);
		if (!user || !(await verifyPassword(current, user.passwordHash))) {
			return fail(401, { error: 'Current password is incorrect.', section: 'password' });
		}
		const problem = validatePasswordStrength(next);
		if (problem) return fail(400, { error: problem, section: 'password' });
		await db
			.update(users)
			.set({ passwordHash: await hashPassword(next) })
			.where(eq(users.id, locals.user!.id));
		// Keep this browser signed in; sign out everywhere else.
		await destroyUserSessions(locals.user!.id, cookies.get(cookieName()));
		return { success: true, section: 'password' };
	}
};
