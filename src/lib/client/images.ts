export async function uploadImage(
	file: File
): Promise<{ url: string; width: number; height: number } | null> {
	const body = new FormData();
	body.append('file', file);
	try {
		const res = await fetch('/api/images', { method: 'POST', body });
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	}
}
