import type { PageServerLoad } from './$types';
import { listTimeline, journalStats, writingDays, allTags } from '$lib/server/entries';
import { dailyPrompt } from '$lib/server/prompts';
import { todayString, isValidDateString } from '$lib/dates';

export const load: PageServerLoad = async ({ locals, url }) => {
	const userId = locals.user!.id;
	const beforeEntryDate = url.searchParams.get('before');
	const beforeCreatedAt = url.searchParams.get('beforeCreated');

	const timeline = await listTimeline(userId, {
		beforeEntryDate:
			beforeEntryDate && isValidDateString(beforeEntryDate) ? beforeEntryDate : undefined,
		beforeCreatedAt: isoTimestamp(beforeCreatedAt),
		limit: 10
	});

	const [stats, days, prompt, tags] = await Promise.all([
		journalStats(userId),
		writingDays(userId),
		dailyPrompt(),
		allTags(userId)
	]);

	return {
		timeline,
		stats,
		days,
		prompt,
		tags,
		today: todayString()
	};
};

function isoTimestamp(value: string | null): string | undefined {
	if (!value) return undefined;
	const time = new Date(value);
	return Number.isNaN(time.getTime()) ? undefined : time.toISOString();
}
