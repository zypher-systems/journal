import { redirect, type Handle } from '@sveltejs/kit';
import { cookieName, cookieOptions, validateSession } from '$lib/server/auth/session';
import { THEME_COOKIE, isThemePreference, themeCookieOptions } from '$lib/server/theme';

const PUBLIC_PATHS = new Set(['/login', '/api/health']);

export const handle: Handle = async ({ event, resolve }) => {
	const { cookies, url } = event;

	const token = cookies.get(cookieName());
	const result = token ? await validateSession(token) : null;
	event.locals.user = result?.user ?? null;
	event.locals.sessionExpires = result?.expires ?? null;

	// Slide the browser cookie forward alongside the server-side expiry.
	if (result && token) {
		cookies.set(cookieName(), token, cookieOptions(result.expires));
	}

	if (!event.locals.user && !PUBLIC_PATHS.has(url.pathname)) {
		if (url.pathname.startsWith('/api/')) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'content-type': 'application/json' }
			});
		}
		redirect(307, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	const themeFromUser = event.locals.user?.themePreference;
	const cookieTheme = cookies.get(THEME_COOKIE);
	if (isThemePreference(themeFromUser) && cookieTheme !== themeFromUser) {
		cookies.set(THEME_COOKIE, themeFromUser, themeCookieOptions());
	}

	const theme = isThemePreference(themeFromUser)
		? themeFromUser
		: isThemePreference(cookieTheme)
			? cookieTheme
			: 'system';

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			if (theme === 'dark') return html.replace('<html lang="en">', '<html lang="en" class="dark">');
			if (theme === 'light') return html.replace('<html lang="en">', '<html lang="en" class="light">');
			return html;
		}
	});

	// No framing, no MIME sniffing, and journal URLs stay out of other sites' referrer logs.
	response.headers.set('content-security-policy', "frame-ancestors 'none'");
	response.headers.set('x-frame-options', 'DENY');
	response.headers.set('x-content-type-options', 'nosniff');
	response.headers.set('referrer-policy', 'same-origin');
	return response;
};
