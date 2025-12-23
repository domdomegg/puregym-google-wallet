import * as jose from 'jose';

// Environment variables for Google Wallet
const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID || '';
const CLASS_SUFFIX = 'puregym-membership';

type ServiceAccountKey = {
	client_email: string;
	private_key: string;
};

function getServiceAccountKey(): ServiceAccountKey {
	const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
	if (!keyJson) {
		throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable not set');
	}

	return JSON.parse(keyJson);
}

export function getClassId(): string {
	return `${ISSUER_ID}.${CLASS_SUFFIX}`;
}

export function getObjectId(email: string): string {
	// Create a safe identifier from email
	const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
	return `${ISSUER_ID}.${safeEmail}`;
}

type PassData = {
	email: string;
	memberName: string;
	qrCode: string;
};

function createPassObject(data: PassData) {
	const objectId = getObjectId(data.email);
	const classId = getClassId();

	return {
		id: objectId,
		classId,
		genericType: 'GENERIC_TYPE_UNSPECIFIED',
		cardTitle: {
			defaultValue: {
				language: 'en',
				value: 'PureGym',
			},
		},
		header: {
			defaultValue: {
				language: 'en',
				value: data.memberName,
			},
		},
		subheader: {
			defaultValue: {
				language: 'en',
				value: 'Membership',
			},
		},
		barcode: {
			type: 'QR_CODE',
			value: data.qrCode,
		},
		hexBackgroundColor: '#000000',
		logo: {
			sourceUri: {
				uri: 'https://www.puregym.com/favicon.ico',
			},
		},
	};
}

function createPassClass() {
	return {
		id: getClassId(),
		issuerName: 'PureGym Wallet',
		reviewStatus: 'UNDER_REVIEW',
	};
}

export async function createAddToWalletUrl(data: PassData): Promise<string> {
	const serviceAccount = getServiceAccountKey();
	const passObject = createPassObject(data);
	const passClass = createPassClass();

	// Create JWT claims
	const claims = {
		iss: serviceAccount.client_email,
		aud: 'google',
		origins: [],
		typ: 'savetowallet',
		payload: {
			genericClasses: [passClass],
			genericObjects: [passObject],
		},
	};

	// Import the private key
	const privateKey = await jose.importPKCS8(serviceAccount.private_key, 'RS256');

	// Sign the JWT
	const jwt = await new jose.SignJWT(claims)
		.setProtectedHeader({alg: 'RS256', typ: 'JWT'})
		.setIssuedAt()
		.sign(privateKey);

	return `https://pay.google.com/gp/v/save/${jwt}`;
}

export async function updatePass(data: PassData): Promise<void> {
	const serviceAccount = getServiceAccountKey();
	const objectId = getObjectId(data.email);
	const passObject = createPassObject(data);

	// Get access token for API calls
	const tokenUrl = 'https://oauth2.googleapis.com/token';
	const privateKey = await jose.importPKCS8(serviceAccount.private_key, 'RS256');

	const assertion = await new jose.SignJWT({
		iss: serviceAccount.client_email,
		scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
		aud: tokenUrl,
	})
		.setProtectedHeader({alg: 'RS256', typ: 'JWT'})
		.setIssuedAt()
		.setExpirationTime('1h')
		.sign(privateKey);

	const tokenResponse = await fetch(tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			assertion,
		}),
	});

	if (!tokenResponse.ok) {
		throw new Error(`Failed to get access token: ${tokenResponse.status}`);
	}

	const {access_token} = await tokenResponse.json();

	// Try to update the pass object (PATCH for partial update)
	const updateUrl = `https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${objectId}`;

	const updateResponse = await fetch(updateUrl, {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${access_token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(passObject),
	});

	if (!updateResponse.ok) {
		const errorText = await updateResponse.text();
		// 404 means pass doesn't exist yet (user hasn't added it), which is fine
		if (updateResponse.status === 404) {
			console.log(`Pass not yet added to wallet for ${data.email}`);
			return;
		}

		throw new Error(`Failed to update pass: ${updateResponse.status} ${errorText}`);
	}

	console.log(`Updated pass for ${data.email}`);
}
