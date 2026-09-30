/**
 * Tiptap JSON → Markdown serializer. Zero dependencies, runs server-side.
 * Covers the node/mark set this app's editor can produce.
 */

type Json = Record<string, any>;

const NODE_HANDLERS: Record<string, (node: Json, children: string) => string> = {
	doc: (_n, children) => children.trimEnd() + '\n',
	paragraph: (_n, children) => (children === '' ? '' : children + '\n\n'),
	heading: (n, children) => `${'#'.repeat(clamp(n.attrs?.level ?? 1, 1, 6))} ${children}\n\n`,
	blockquote: (_n, children) =>
		children
			.trimEnd()
			.split('\n')
			.map((l) => `> ${l}`)
			.join('\n') + '\n\n',
	bulletList: (_n, children) => children,
	orderedList: (_n, children) => children,
	listItem: (_n, children) => children,
	text: (n) => applyMarks(n.text ?? '', n.marks ?? []),
	hardBreak: () => '\n',
	horizontalRule: () => '---\n\n',
	codeBlock: (n, children) => '```\n' + (n.content?.map((c: Json) => textOf(c)).join('') ?? children) + '\n```\n\n',
	image: (n) => `![${n.attrs?.alt ?? ''}](${n.attrs?.src ?? ''})\n\n`
};

function textOf(node: Json): string {
	if (node.type === 'text') return node.text ?? '';
	return (node.content ?? []).map(textOf).join('');
}

function applyMarks(text: string, marks: Json[]): string {
	let out = text;
	for (const m of marks) {
		switch (m.type) {
			case 'bold': out = `**${out}**`; break;
			case 'italic': out = `*${out}*`; break;
			case 'strike': out = `~~${out}~~`; break;
			case 'code': out = `\`${out}\``; break;
			case 'link': out = `[${out}](${m.attrs?.href ?? ''})`; break;
		}
	}
	return out;
}

function clamp(n: number, lo: number, hi: number): number {
	return Math.max(lo, Math.min(hi, n));
}

/** Serialize a list node's items with shared prefixes. */
function serializeList(node: Json, ordered: boolean, indent = 0): string {
	const items = (node.content ?? []).map((item: Json, i: number) => {
		const marker = ordered ? `${i + 1}.` : '-';
		const inner = (item.content ?? [])
			.map((c: Json) => {
				if (c.type === 'bulletList') return serializeList(c, false, indent + 1);
				if (c.type === 'orderedList') return serializeList(c, true, indent + 1);
				return serialize(c, indent > 0);
			})
			.join('');
		const pad = '  '.repeat(indent);
		// First line gets the marker; subsequent (nested) lines are pre-padded.
		const lines = inner.trimEnd().split('\n');
		const [first, ...rest] = lines;
		const body = `${pad}${marker} ${first ?? ''}` + (rest.length ? '\n' + rest.join('\n') : '');
		return body;
	});
	return items.join('\n') + '\n\n';
}

export function serialize(node: Json, inListItem = false): string {
	if (node.type === 'bulletList') return serializeList(node, false);
	if (node.type === 'orderedList') return serializeList(node, true);

	const children = (node.content ?? []).map((c: Json) => serialize(c, inListItem)).join('');
	const handler = NODE_HANDLERS[node.type];
	if (!handler) return children;

	if (inListItem && node.type === 'paragraph') {
		// Inside a list item, paragraphs separate with single newlines.
		return children.trimEnd() + '\n';
	}
	return handler(node, children);
}

export function tiptapToMarkdown(doc: Json): string {
	return serialize(doc);
}
