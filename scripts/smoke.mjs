#!/usr/bin/env node
/**
 * HTTP smoke: health, login, the main authenticated routes, the admin boundary
 * (a member is refused every admin action), and the security fixes that a
 * regression would quietly undo: safe redirects, throttling, escaped search
 * snippets, owner-only images, and sessions ending on password changes.
 * Expects the app already listening at BASE_URL (default http://127.0.0.1:3000)
 * and an admin account from ADMIN_EMAIL / ADMIN_PASSWORD.
 */
const base = (process.env.BASE_URL ?? process.env.ORIGIN ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const email = process.env.ADMIN_EMAIL ?? process.env.SMOKE_EMAIL ?? '';
const password = process.env.ADMIN_PASSWORD ?? process.env.SMOKE_PASSWORD ?? '';
const origin = process.env.ORIGIN ?? base;

// Cookie jars: the admin's, plus one per extra account signed in below.
const jar = new Map();

function storeCookies(res, cookies) {
	const raw = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
	for (const c of raw) {
		const pair = c.split(';')[0];
		const eq = pair.indexOf('=');
		if (eq > 0) cookies.set(pair.slice(0, eq), pair.slice(eq + 1));
	}
}

function cookieHeader(cookies) {
	return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

async function request(method, path, { body, headers = {}, redirect = 'manual', cookies = jar } = {}) {
	const res = await fetch(`${base}${path}`, {
		method,
		headers: {
			...(cookieHeader(cookies) ? { cookie: cookieHeader(cookies) } : {}),
			...headers
		},
		body,
		redirect
	});
	storeCookies(res, cookies);
	return res;
}

function postForm(path, fields, { cookies = jar } = {}) {
	return request('POST', path, {
		body: new URLSearchParams(fields).toString(),
		headers: {
			accept: 'text/html,application/xhtml+xml',
			'content-type': 'application/x-www-form-urlencoded',
			origin
		},
		cookies
	});
}

function fail(msg) {
	console.error(`smoke fail: ${msg}`);
	process.exit(1);
}

async function expectStatus(method, path, allowed, opts) {
	const res = await request(method, path, opts);
	if (!allowed.includes(res.status)) {
		fail(`${method} ${path} → ${res.status} (wanted ${allowed.join('|')})`);
	}
	return res;
}

async function login(who, pass, cookies, redirectTo = '/') {
	const res = await postForm('/login', { email: who, password: pass, redirectTo }, { cookies });
	const body = res.status === 200 ? await res.text() : '';
	const redirected =
		res.status === 200 && body.includes('"type":"redirect"')
			? true
			: [302, 303, 307].includes(res.status);
	if (!redirected) {
		fail(`POST /login as ${who} → ${res.status} (wanted redirect). ${body.slice(0, 200)}`);
	}
	if (!cookies.has('journal_session')) fail(`login as ${who} did not set journal_session`);
	return res;
}

async function waitForHealth(tries = 40) {
	for (let i = 1; i <= tries; i++) {
		try {
			const res = await fetch(`${base}/api/health`);
			if (res.ok) return;
		} catch {
			/* still coming up */
		}
		await new Promise((r) => setTimeout(r, 500));
	}
	fail(`health never became ready at ${base}`);
}

await waitForHealth();

const health = await expectStatus('GET', '/api/health', [200]);
const healthBody = await health.json();
if (!healthBody.ok) fail('health payload missing ok');
console.log('ok  GET /api/health');

const loginPage = await expectStatus('GET', '/login', [200]);
const loginHtml = await loginPage.text();
if (!loginHtml.includes('journal')) fail('login page missing journal mark');
if (!loginHtml.includes('name="email"')) fail('login page missing email field');
if (loginPage.headers.get('x-frame-options') !== 'DENY') fail('login page can be framed');
if (loginPage.headers.get('x-content-type-options') !== 'nosniff') fail('login page missing nosniff');
console.log('ok  GET /login (with security headers)');

if (!email || !password) {
	console.log('skip authenticated routes (set ADMIN_EMAIL and ADMIN_PASSWORD)');
	process.exit(0);
}

await login(email, password, jar);
console.log('ok  POST /login');

const today = new Date();
const day = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const routes = [
	'/',
	'/search',
	'/search?q=the',
	'/new',
	'/settings',
	`/day/${day}`,
	'/tag/none',
	'/tag/100%25',
	'/?before=2026-01-01&beforeCreated=not-a-time'
];
for (const path of routes) {
	const res = await expectStatus('GET', path, [200]);
	const html = await res.text();
	if (!html.includes('journal')) fail(`${path} missing journal chrome`);
	console.log(`ok  GET ${path}`);
}

const home = await request('GET', '/');
const homeHtml = await home.text();
const hrefs = [...homeHtml.matchAll(/href="(\/[^"]+)"/g)].map((m) => m[1]);
const unique = [...new Set(hrefs)].filter((h) => !h.startsWith('/logout') && !h.startsWith('/api/')).slice(0, 12);
for (const href of unique) {
	const path = href.split('#')[0];
	const res = await request('GET', path);
	if (![200, 302, 303, 307].includes(res.status)) fail(`link ${path} → ${res.status}`);
	console.log(`ok  link ${path}`);
}

// Admin boundary. A unique email keeps repeat runs against one database apart.
const member = { email: `smoke-member-${Date.now()}@example.com`, password: 'smoke-member-1' };
const created = await postForm('/admin?/create', {
	name: 'Smoke Member',
	email: member.email,
	password: member.password,
	role: 'member'
});
if (created.status !== 200) fail(`admin POST /admin?/create → ${created.status} (wanted 200)`);
console.log('ok  admin creates a member');

const adminPage = await (await expectStatus('GET', '/admin', [200])).text();
const memberId = adminPage.slice(adminPage.indexOf(member.email)).match(/name="id" value="([0-9a-f-]{36})"/)?.[1];
if (!memberId) fail('admin page missing the new member');

const memberJar = new Map();
await login(member.email, member.password, memberJar);
console.log('ok  POST /login as member');

await expectStatus('GET', '/admin', [302, 303, 307], { cookies: memberJar });
console.log('ok  member redirected away from /admin');

const attempts = {
	create: { name: 'Intruder', email: `smoke-intruder-${Date.now()}@example.com`, password: 'intruder-1', role: 'admin' },
	toggle: { id: memberId },
	reset: { id: memberId, password: 'intruder-1' }
};
for (const [action, fields] of Object.entries(attempts)) {
	const res = await postForm(`/admin?/${action}`, fields, { cookies: memberJar });
	if (res.status !== 403) fail(`member POST /admin?/${action} → ${res.status} (wanted 403)`);
	console.log(`ok  member refused /admin?/${action}`);
}

// An admin password reset signs the member out everywhere.
const reset = await postForm('/admin?/reset', { id: memberId, password: 'smoke-member-2' });
if (reset.status !== 200) fail(`admin POST /admin?/reset → ${reset.status} (wanted 200)`);
await expectStatus('GET', '/', [302, 303, 307], { cookies: memberJar });
console.log('ok  reset ends the member’s sessions');

// Sign-in only redirects within the site.
for (const target of ['//evil.example/x', '/\\evil.example/x']) {
	const res = await login(email, password, new Map(), target);
	const location = res.headers.get('location') ?? '';
	if (location !== '/') fail(`redirectTo ${target} → location ${location} (wanted /)`);
}
console.log('ok  sign-in ignores off-site redirects');

// Search snippets are escaped: an entry that mentions HTML shows it as text.
const needle = `smokeneedle${Date.now()}`;
const plainText = `before <img src=x onerror=alert(1)> ${needle} after`;
const entry = await request('POST', '/api/entries', {
	body: JSON.stringify({
		content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: plainText }] }] },
		plainText,
		wordCount: 6,
		entryDate: day,
		tags: []
	}),
	headers: { 'content-type': 'application/json' }
});
if (entry.status !== 201) fail(`POST /api/entries → ${entry.status} (wanted 201)`);
const searchHtml = await (await expectStatus('GET', `/search?q=${needle}`, [200])).text();
if (searchHtml.includes('<img src=x')) fail('search snippet rendered raw HTML');
if (!searchHtml.includes('&lt;img src=x')) fail('search snippet missing the escaped text');
if (!searchHtml.includes(`<mark>${needle}</mark>`)) fail('search snippet lost its highlight');
console.log('ok  search snippets escaped, highlight kept');

// Changing your own password keeps this browser signed in and ends the others.
const here = new Map();
const elsewhere = new Map();
await login(member.email, 'smoke-member-2', here);
await login(member.email, 'smoke-member-2', elsewhere);
const changed = await postForm('/settings?/password', { current: 'smoke-member-2', next: 'smoke-member-3' }, { cookies: here });
if (changed.status !== 200) fail(`POST /settings?/password → ${changed.status} (wanted 200)`);
await expectStatus('GET', '/', [200], { cookies: here });
await expectStatus('GET', '/', [302, 303, 307], { cookies: elsewhere });
console.log('ok  password change ends other sessions');

// Photos are processed, and only ever served to their owner.
const png = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
	'base64'
);
const upload = new FormData();
upload.append('file', new Blob([png], { type: 'image/png' }), 'dot.png');
const uploaded = await request('POST', '/api/images', { body: upload, headers: { origin } });
if (uploaded.status !== 201) fail(`POST /api/images → ${uploaded.status} (wanted 201)`);
const { url: imageUrl } = await uploaded.json();
const image = await expectStatus('GET', imageUrl, [200]);
if (image.headers.get('content-type') !== 'image/webp') fail(`image served as ${image.headers.get('content-type')}`);
await expectStatus('GET', imageUrl, [404], { cookies: here });
console.log('ok  image upload, owner-only serving');

// Signing out takes a POST, so a link from another site can't do it.
await expectStatus('GET', '/logout', [405], { cookies: here });
await expectStatus('GET', '/', [200], { cookies: here });
console.log('ok  GET /logout refused (POST only)');

// Repeated failures for one account are throttled.
const target = `smoke-nobody-${Date.now()}@example.com`;
for (let i = 1; i <= 5; i++) {
	const res = await postForm('/login', { email: target, password: 'wrong-password' }, { cookies: new Map() });
	if (res.status !== 401) fail(`failed sign-in ${i} → ${res.status} (wanted 401)`);
}
const throttled = await postForm('/login', { email: target, password: 'wrong-password' }, { cookies: new Map() });
if (throttled.status !== 429) fail(`sign-in after 5 failures → ${throttled.status} (wanted 429)`);
console.log('ok  sign-in throttled after 5 failures');

console.log('smoke passed');
