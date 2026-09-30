import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { allTags, getEntry } from '$lib/server/entries';

export const load: PageServerLoad = async ({ locals, params }) => {
	const [entryWithTags, suggestions] = await Promise.all([
		getEntry(locals.user!.id, params.id),
		allTags(locals.user!.id)
	]);
	if (!entryWithTags) error(404, 'Entry not found');
	return {
		initial: {
			id: entryWithTags.entry.id,
			title: entryWithTags.entry.title ?? '',
			entryDate: entryWithTags.entry.entryDate,
			content: entryWithTags.entry.content,
			tags: entryWithTags.tags
		},
		suggestions
	};
};
