import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { cookieName, cookieOptions, destroySession } from '$lib/server/auth/session';

export const POST: RequestHandler = async ({ cookies }) => {
	const token = cookies.get(cookieName());
	await destroySession(token);
	cookies.delete(cookieName(), { path: '/' });
	redirect(302, '/login');
};
