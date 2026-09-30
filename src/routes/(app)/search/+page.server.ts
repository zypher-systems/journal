import type { PageServerLoad } from './$types';
import { searchEntries } from '$lib/server/entries';

export const load: PageServerLoad = async ({ locals, url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	if (!q) return { q: '', results: [] };
	const results = await searchEntries(locals.user!.id, q);
	return { q, results };
};
