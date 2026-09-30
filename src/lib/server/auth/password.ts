import { hash, verify } from '@node-rs/argon2';

/** Argon2id with OWASP-recommended parameters. */
const opts = {
	memoryCost: 19456,
	timeCost: 2,
	parallelism: 1
} as const;

export async function hashPassword(password: string): Promise<string> {
	return hash(password, opts);
}

export async function verifyPassword(
	password: string,
	passwordHash: string
): Promise<boolean> {
	try {
		return await verify(passwordHash, password, opts);
	} catch {
		return false;
	}
}

export function validatePasswordStrength(password: string): string | null {
	if (password.length < 8) return 'Password must be at least 8 characters.';
	if (password.length > 256) return 'Password must be under 256 characters.';
	return null;
}
