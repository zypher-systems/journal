import type { PageServerLoad } from './$types';
import { allTags } from '$lib/server/entries';
import { dailyPrompt } from '$lib/server/prompts';
import { todayString } from '$lib/dates';

export const load: PageServerLoad = async ({ locals }) => {
	const [prompt, suggestions] = await Promise.all([dailyPrompt(), allTags(locals.user!.id)]);
	return {
		initial: {
			title: '',
			entryDate: todayString(),
			tags: [] as string[],
			content: undefined
		},
		prompt,
		suggestions
	};
};
