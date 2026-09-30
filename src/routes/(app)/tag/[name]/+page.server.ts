import type { PageServerLoad } from './$types';
import { entriesByTag } from '$lib/server/entries';

export const load: PageServerLoad = async ({ locals, params }) => {
	const requested = (params.name ?? '').trim();
	const { name, items } = await entriesByTag(locals.user!.id, requested);
	return { name: name || requested, items };
};
