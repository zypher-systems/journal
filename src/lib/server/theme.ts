export const THEME_COOKIE = 'journal-theme';
export const VALID_THEMES = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof VALID_THEMES)[number];

export function isThemePreference(value: unknown): value is ThemePreference {
	return typeof value === 'string' && (VALID_THEMES as readonly string[]).includes(value);
}

export function themeCookieOptions() {
	return {
		path: '/',
		httpOnly: false,
		sameSite: 'lax' as const,
		secure: process.env.COOKIE_SECURE === 'true',
		maxAge: 60 * 60 * 24 * 365
	};
}
