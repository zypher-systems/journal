import type { RequestHandler } from './$types';
import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/db';
import { entries, entryTags, tags } from '$lib/db/schema';
import { tiptapToMarkdown } from '$lib/markdown';
import { formatMedium } from '$lib/dates';

export const GET: RequestHandler = async ({ locals }) => {
	const JSZip = (await import('jszip')).default;

	const rows = await db
		.select({
			entry: entries,
			tagName: tags.name
		})
		.from(entries)
		.leftJoin(entryTags, eq(entryTags.entryId, entries.id))
		.leftJoin(tags, eq(entryTags.tagId, tags.id))
		.where(eq(entries.userId, locals.user!.id))
		.orderBy(entries.entryDate, entries.createdAt);

	// Group rows → entry + tag names.
	const grouped = new Map<string, { entry: (typeof rows)[number]['entry']; tags: string[] }>();
	for (const row of rows) {
		const g = grouped.get(row.entry.id) ?? { entry: row.entry, tags: [] };
		if (row.tagName) g.tags.push(row.tagName);
		grouped.set(row.entry.id, g);
	}

	const zip = new JSZip();
	for (const { entry, tags: entryTagNames } of grouped.values()) {
		const title = entry.title?.trim() || 'untitled';
		const md =
			[
				`# ${title}`,
				``,
				`*${formatMedium(entry.entryDate)} · ${entry.wordCount} words${
					entryTagNames.length ? ` · ${entryTagNames.map((t) => `#${t}`).join(' ')}` : ''
				}*`,
				``,
				tiptapToMarkdown(entry.content as Record<string, unknown>)
			].join('\n') + '\n';
		// Date-prefixed filenames sort chronologically in any file manager.
		zip.file(`${entry.entryDate} ${title.replace(/[\\/]/g, '-').slice(0, 60) || 'untitled'}.md`, md);
	}

	const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
	return new Response(new Uint8Array(content), {
		headers: {
			'content-type': 'application/zip',
			'content-disposition': `attachment; filename="journal-${locals.user!.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')}.zip"`,
			'cache-control': 'no-store'
		}
	});
};
