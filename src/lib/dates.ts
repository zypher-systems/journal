/** Local-calendar helpers. Dates are handled as 'YYYY-MM-DD' strings throughout. */

export function toLocalDateString(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function todayString(): string {
	return toLocalDateString(new Date());
}

export function parseDateString(s: string): Date {
	const [y, m, d] = s.split('-').map(Number);
	return new Date(y, m - 1, d);
}

export function isValidDateString(s: unknown): s is string {
	return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parseDateString(s).getTime());
}

/** Whole days between two date strings (b - a). */
export function daysBetween(a: string, b: string): number {
	return Math.round((parseDateString(b).getTime() - parseDateString(a).getTime()) / 864e5);
}

export function addDays(s: string, n: number): string {
	const d = parseDateString(s);
	d.setDate(d.getDate() + n);
	return toLocalDateString(d);
}

export function formatLong(s: string): string {
	return parseDateString(s).toLocaleDateString(undefined, {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

export function formatMedium(s: string): string {
	return parseDateString(s).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

export function formatWords(n: number): string {
	return `${n.toLocaleString()} ${n === 1 ? 'word' : 'words'}`;
}

/** 'Good morning / afternoon / evening' based on hour. */
export function greeting(): string {
	const h = new Date().getHours();
	if (h < 5) return 'Up late';
	if (h < 12) return 'Good morning';
	if (h < 17) return 'Good afternoon';
	if (h < 22) return 'Good evening';
	return 'Good night';
}
