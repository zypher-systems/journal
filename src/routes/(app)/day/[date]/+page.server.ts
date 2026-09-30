import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { entriesForDate } from '$lib/server/entries';
import { isValidDateString } from '$lib/dates';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!isValidDateString(params.date)) error(404, 'No such day');
	const items = await entriesForDate(locals.user!.id, params.date);
	return { date: params.date, items };
};
