/** Encode a tag for `/tag/[name]` so spaces and punctuation stay intact. */
export function tagHref(name: string): string {
	return `/tag/${encodeURIComponent(name)}`;
}
