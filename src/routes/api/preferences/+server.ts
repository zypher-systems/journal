import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { isThemePreference, THEME_COOKIE, themeCookieOptions } from '$lib/server/theme';

export const POST: RequestHandler = async ({ locals, request, cookies }) => {
	if (!locals.user) error(401, 'Unauthorized');
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const theme = (body as { theme?: string })?.theme;
	if (!isThemePreference(theme)) error(400, 'Invalid theme');
	await db
		.update(users)
		.set({ themePreference: theme })
		.where(eq(users.id, locals.user.id));
	cookies.set(THEME_COOKIE, theme, themeCookieOptions());
	return new Response(null, { status: 204 });
};
