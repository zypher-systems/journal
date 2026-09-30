import { error } from '@sveltejs/kit';
import { isValidDateString } from '$lib/dates';
import type { SaveEntryData } from '$lib/server/entries';

const MAX_TEXT = 500_000; // generous ceiling for a long, long entry

/** Validate a create/update body from the editor; throws 400 when it isn't an entry. */
export function parseEntryPayload(body: unknown): SaveEntryData {
	const b = (body ?? {}) as Record<string, unknown>;
	const title = typeof b.title === 'string' ? b.title.slice(0, 300) : null;
	const content = b.content;
	const plainText = typeof b.plainText === 'string' ? b.plainText.slice(0, MAX_TEXT) : '';
	const wordCount = Number(b.wordCount ?? 0);
	const entryDate = b.entryDate;
	const tagNames = Array.isArray(b.tags)
		? b.tags.filter((t): t is string => typeof t === 'string').slice(0, 12)
		: [];

	if (
		!content ||
		typeof content !== 'object' ||
		(content as { type?: string }).type !== 'doc' ||
		!isValidDateString(entryDate) ||
		plainText.length === 0
	) {
		error(400, 'Invalid entry payload');
	}
	return {
		title,
		content,
		plainText,
		wordCount: Number.isFinite(wordCount) ? Math.min(Math.max(wordCount, 0), 100_000) : 0,
		entryDate,
		tagNames
	};
}
