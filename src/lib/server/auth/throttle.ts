/**
 * In-memory sign-in throttle. Counts failed attempts per account and per client
 * address in a fixed window. It lives in the process, so a restart clears it.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_ACCOUNT = 5;
// Loose, because a household behind one proxy shares an address.
const MAX_PER_ADDRESS = 50;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function current(key: string, now: number): Bucket | undefined {
	const bucket = buckets.get(key);
	if (bucket && bucket.resetAt <= now) {
		buckets.delete(key);
		return undefined;
	}
	return bucket;
}

function sweep(now: number) {
	for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}

export function isThrottled(account: string, address: string, now = Date.now()): boolean {
	return (
		(current(`account:${account}`, now)?.count ?? 0) >= MAX_PER_ACCOUNT ||
		(current(`address:${address}`, now)?.count ?? 0) >= MAX_PER_ADDRESS
	);
}

export function recordFailure(account: string, address: string, now = Date.now()): void {
	if (buckets.size > 10_000) sweep(now);
	for (const key of [`account:${account}`, `address:${address}`]) {
		const bucket = current(key, now) ?? { count: 0, resetAt: now + WINDOW_MS };
		bucket.count++;
		buckets.set(key, bucket);
	}
}

export function clearAccount(account: string): void {
	buckets.delete(`account:${account}`);
}
