const AUTH_URL = 'https://auth.puregym.com/connect/token';
const API_BASE = 'https://capi.puregym.com/api';

// Hardcoded client credentials from PureGym app (public knowledge)
const CLIENT_ID = 'ro.client';
const CLIENT_SECRET = '';

export type PureGymTokens = {
	accessToken: string;
	refreshToken: string;
	expiresAt: Date;
};

export type PureGymQrCode = {
	qrCode: string;
	expiresAt: Date;
};

export type PureGymMember = {
	firstName: string;
	lastName: string;
};

// Extract member info from JWT token (avoids Cloudflare-blocked API)
export function getMemberInfoFromToken(accessToken: string): PureGymMember {
	const payload = accessToken.split('.')[1];
	const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());

	return {
		firstName: decoded.given_name || '',
		lastName: decoded.family_name || '',
	};
}

export async function authenticate(email: string, pin: string): Promise<PureGymTokens> {
	const body = new URLSearchParams({
		grant_type: 'password',
		username: email,
		password: pin,
		scope: 'pgcapi',
	});

	const response = await fetch(AUTH_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
		},
		body: body.toString(),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`PureGym auth failed: ${response.status} ${text}`);
	}

	const data = await response.json();

	return {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresAt: new Date(Date.now() + (data.expires_in * 1000)),
	};
}

export async function refreshAccessToken(refreshToken: string): Promise<PureGymTokens> {
	const body = new URLSearchParams({
		grant_type: 'refresh_token',
		refresh_token: refreshToken,
	});

	const response = await fetch(AUTH_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
		},
		body: body.toString(),
	});

	if (!response.ok) {
		throw new Error(`PureGym token refresh failed: ${response.status}`);
	}

	const data = await response.json();

	return {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresAt: new Date(Date.now() + (data.expires_in * 1000)),
	};
}

export async function getQrCode(accessToken: string): Promise<PureGymQrCode> {
	const response = await fetch(`${API_BASE}/v2/member/qrcode`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'User-Agent': 'PureGym/1523 CFNetwork/1568.200.51 Darwin/24.1.0',
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to get QR code: ${response.status}`);
	}

	const data = await response.json();

	return {
		qrCode: data.QrCode,
		expiresAt: new Date(data.ExpiresAt),
	};
}
