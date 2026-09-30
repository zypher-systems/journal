import { sql } from 'drizzle-orm';
import { db } from '$lib/db';
import { prompts } from '$lib/db/schema';
import fallback from '$lib/data/prompts.json';

/** Days since the Unix epoch — the deterministic "prompt of the day" index. */
function epochDay(): number {
	return Math.floor(Date.now() / 864e5);
}

export async function dailyPrompt(): Promise<string> {
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(prompts);
	if (count === 0) return fallback[epochDay() % fallback.length];
	const offset = epochDay() % count;
	const [row] = await db
		.select({ body: prompts.body })
		.from(prompts)
		.orderBy(prompts.id)
		.limit(1)
		.offset(offset);
	return row?.body ?? fallback[0];
}
