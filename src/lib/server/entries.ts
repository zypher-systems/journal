import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from '$lib/db';
import { entries, entryTags, tags, type Entry } from '$lib/db/schema';
import { addDays, todayString } from '$lib/dates';

export type EntryWithTags = { entry: Entry; tags: string[] };

export type SaveEntryData = {
	title?: string | null;
	content: unknown;
	plainText: string;
	wordCount: number;
	entryDate: string;
	tagNames: string[];
};

const MAX_TAGS = 12;

function normalizeTagNames(names: string[]): string[] {
	const seen = new Set<string>();
	for (const raw of names) {
		const n = raw.trim().replace(/\s+/g, ' ').slice(0, 40);
		if (n) seen.add(n);
	}
	return [...seen].slice(0, MAX_TAGS);
}

async function resolveTagIds(userId: string, names: string[]): Promise<string[]> {
	const normalized = normalizeTagNames(names);
	if (normalized.length === 0) return [];

	const existing = await db
		.select({ id: tags.id, name: tags.name })
		.from(tags)
		.where(eq(tags.userId, userId));
	const byName = new Map(existing.map((t) => [t.name.toLowerCase(), t.id]));

	const ids: string[] = [];
	const toCreate: string[] = [];
	for (const n of normalized) {
		const hit = byName.get(n.toLowerCase());
		if (hit) ids.push(hit);
		else toCreate.push(n);
	}
	if (toCreate.length > 0) {
		const inserted = await db
			.insert(tags)
			.values(toCreate.map((name) => ({ userId, name })))
			.onConflictDoNothing()
			.returning({ id: tags.id });
		ids.push(...inserted.map((t) => t.id));
	}
	return ids;
}

async function tagsForEntries(entryIds: string[]): Promise<Map<string, string[]>> {
	const map = new Map<string, string[]>();
	if (entryIds.length === 0) return map;
	const rows = await db
		.select({ entryId: entryTags.entryId, name: tags.name })
		.from(entryTags)
		.innerJoin(tags, eq(entryTags.tagId, tags.id))
		.where(inArray(entryTags.entryId, entryIds));
	for (const r of rows) {
		const list = map.get(r.entryId) ?? [];
		list.push(r.name);
		map.set(r.entryId, list);
	}
	return map;
}

export async function createEntry(userId: string, data: SaveEntryData): Promise<Entry> {
	const tagIds = await resolveTagIds(userId, data.tagNames);
	return db.transaction(async (tx) => {
		const [entry] = await tx
			.insert(entries)
			.values({
				userId,
				title: data.title?.trim() || null,
				content: data.content,
				plainText: data.plainText,
				wordCount: data.wordCount,
				entryDate: data.entryDate
			})
			.returning();
		if (tagIds.length > 0) {
			await tx
				.insert(entryTags)
				.values(tagIds.map((tagId) => ({ entryId: entry.id, tagId })))
				.onConflictDoNothing();
		}
		return entry;
	});
}

export async function updateEntry(
	userId: string,
	id: string,
	data: SaveEntryData
): Promise<Entry | null> {
	const tagIds = await resolveTagIds(userId, data.tagNames);
	return db.transaction(async (tx) => {
		const [entry] = await tx
			.update(entries)
			.set({
				title: data.title?.trim() || null,
				content: data.content,
				plainText: data.plainText,
				wordCount: data.wordCount,
				entryDate: data.entryDate,
				updatedAt: new Date()
			})
			.where(and(eq(entries.id, id), eq(entries.userId, userId)))
			.returning();
		if (!entry) return null;
		await tx.delete(entryTags).where(eq(entryTags.entryId, entry.id));
		if (tagIds.length > 0) {
			await tx
				.insert(entryTags)
				.values(tagIds.map((tagId) => ({ entryId: entry.id, tagId })))
				.onConflictDoNothing();
		}
		return entry;
	});
}

export async function getEntry(userId: string, id: string): Promise<EntryWithTags | null> {
	const [entry] = await db
		.select()
		.from(entries)
		.where(and(eq(entries.id, id), eq(entries.userId, userId)))
		.limit(1);
	if (!entry) return null;
	const tagMap = await tagsForEntries([entry.id]);
	return { entry, tags: (tagMap.get(entry.id) ?? []).sort() };
}

export async function deleteEntry(userId: string, id: string): Promise<boolean> {
	const deleted = await db
		.delete(entries)
		.where(and(eq(entries.id, id), eq(entries.userId, userId)))
		.returning({ id: entries.id });
	return deleted.length > 0;
}

export async function listTimeline(
	userId: string,
	opts: { beforeEntryDate?: string; beforeCreatedAt?: string; limit?: number } = {}
): Promise<{ items: EntryWithTags[]; nextCursor: { entryDate: string; createdAt: string } | null }> {
	const limit = Math.min(opts.limit ?? 12, 50);
	const where = [eq(entries.userId, userId)];
	if (opts.beforeEntryDate && opts.beforeCreatedAt) {
		where.push(
			sql`(${entries.entryDate} < ${opts.beforeEntryDate}::date or (${entries.entryDate} = ${opts.beforeEntryDate}::date and ${entries.createdAt} < ${opts.beforeCreatedAt}::timestamptz))`
		);
	}
	const rows = await db
		.select()
		.from(entries)
		.where(and(...where))
		.orderBy(desc(entries.entryDate), desc(entries.createdAt))
		.limit(limit + 1);

	const page = rows.slice(0, limit);
	const tagMap = await tagsForEntries(page.map((e) => e.id));
	const items = page.map((entry) => ({ entry, tags: (tagMap.get(entry.id) ?? []).sort() }));

	const hasMore = rows.length > limit;
	const last = page[page.length - 1];
	return {
		items,
		nextCursor: hasMore && last ? { entryDate: last.entryDate, createdAt: last.createdAt.toISOString() } : null
	};
}

export async function entriesForDate(userId: string, date: string): Promise<EntryWithTags[]> {
	const rows = await db
		.select()
		.from(entries)
		.where(and(eq(entries.userId, userId), eq(entries.entryDate, date)))
		.orderBy(entries.createdAt);
	const tagMap = await tagsForEntries(rows.map((e) => e.id));
	return rows.map((entry) => ({ entry, tags: (tagMap.get(entry.id) ?? []).sort() }));
}

// ts_headline doesn't escape HTML, so highlights come back wrapped in
// private-use characters and the snippet is escaped before they become <mark>.
const MARK_START = '\uE000';
const MARK_END = '\uE001';
const HEADLINE_OPTIONS = `StartSel=${MARK_START}, StopSel=${MARK_END}, MaxFragments=2, MaxWords=30, MinWords=6`;

function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Search results; `snippet` is safe HTML with only <mark> tags. */
export async function searchEntries(userId: string, q: string, limit = 25) {
	const query = websearchTsquery(q);
	if (!query) return [];
	const tsquery = sql`websearch_to_tsquery('english', ${q})`;
	const rows = await db
		.select({
			entry: entries,
			rank: sql<number>`ts_rank(${entries.searchVector}, ${tsquery})`,
			snippet: sql<string>`ts_headline('english', ${entries.plainText}, ${tsquery}, ${HEADLINE_OPTIONS})`
		})
		.from(entries)
		.where(and(eq(entries.userId, userId), sql`${entries.searchVector} @@ ${tsquery}`))
		.orderBy(desc(sql`ts_rank(${entries.searchVector}, ${tsquery})`), desc(entries.entryDate))
		.limit(limit);
	return rows.map((row) => ({
		...row,
		snippet: escapeHtml(row.snippet).replaceAll(MARK_START, '<mark>').replaceAll(MARK_END, '</mark>')
	}));
}

function websearchTsquery(q: string): string | null {
	const trimmed = q.trim();
	if (trimmed.length < 2 || trimmed.length > 200) return null;
	return trimmed;
}

export type WritingDay = { date: string; words: number };

export async function writingDays(userId: string, sinceDate?: string): Promise<WritingDay[]> {
	const since = sinceDate ?? addDays(todayString(), -371);
	const rows = await db
		.select({ date: entries.entryDate, words: sql<number>`sum(${entries.wordCount})::int` })
		.from(entries)
		.where(and(eq(entries.userId, userId), gte(entries.entryDate, since)))
		.groupBy(entries.entryDate);
	return rows.map((r) => ({ date: r.date, words: r.words }));
}

export type JournalStats = {
	totalEntries: number;
	totalWords: number;
	currentStreak: number;
	longestStreak: number;
};

export async function journalStats(userId: string): Promise<JournalStats> {
	const [agg] = await db
		.select({
			entries: sql<number>`count(*)::int`,
			words: sql<number>`coalesce(sum(${entries.wordCount}), 0)::int`
		})
		.from(entries)
		.where(eq(entries.userId, userId));

	const allDays = await db
		.select({ date: entries.entryDate })
		.from(entries)
		.where(eq(entries.userId, userId))
		.orderBy(entries.entryDate);

	const dates = new Set(allDays.map((d) => d.date));

	// Longest streak.
	let longest = 0;
	let run = 0;
	let prev: string | null = null;
	for (const d of dates) {
		run = prev && addDays(prev, 1) === d ? run + 1 : 1;
		longest = Math.max(longest, run);
		prev = d;
	}

	// Current streak: count back from today (grace for not-yet-written today).
	const today = todayString();
	let cursor = dates.has(today) ? today : addDays(today, -1);
	let current = 0;
	if (dates.has(cursor)) {
		current = 1;
		while (dates.has(addDays(cursor, -1))) {
			cursor = addDays(cursor, -1);
			current++;
		}
	}

	return {
		totalEntries: agg?.entries ?? 0,
		totalWords: agg?.words ?? 0,
		currentStreak: current,
		longestStreak: longest
	};
}

export async function allTags(userId: string): Promise<string[]> {
	const rows = await db
		.select({ name: tags.name })
		.from(tags)
		.where(eq(tags.userId, userId))
		.orderBy(tags.name);
	return rows.map((r) => r.name);
}

/** Entries for a tag (case-insensitive). Returns the stored tag name when found. */
export async function entriesByTag(
	userId: string,
	tagName: string,
	limit = 50
): Promise<{ name: string; items: EntryWithTags[] }> {
	const needle = tagName.trim();
	if (!needle) return { name: tagName, items: [] };

	const [tag] = await db
		.select({ id: tags.id, name: tags.name })
		.from(tags)
		.where(and(eq(tags.userId, userId), sql`lower(${tags.name}) = ${needle.toLowerCase()}`))
		.limit(1);

	if (!tag) return { name: needle, items: [] };

	const rows = await db
		.select({ entry: entries })
		.from(entries)
		.innerJoin(entryTags, eq(entryTags.entryId, entries.id))
		.where(and(eq(entries.userId, userId), eq(entryTags.tagId, tag.id)))
		.orderBy(desc(entries.entryDate), desc(entries.createdAt))
		.limit(limit);

	const page = rows.map((r) => r.entry);
	const tagMap = await tagsForEntries(page.map((e) => e.id));
	return {
		name: tag.name,
		items: page.map((entry) => ({ entry, tags: (tagMap.get(entry.id) ?? []).sort() }))
	};
}
