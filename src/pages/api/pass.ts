import type {NextApiRequest, NextApiResponse} from 'next';
import {authenticate, getQrCode, getMemberInfoFromToken} from '../../lib/puregym';
import {getUser, saveUser, type StoredUser} from '../../lib/storage';
import {createAddToWalletUrl, getObjectId} from '../../lib/wallet';

type PassRequest = {
	email: string;
	pin: string;
};

type PassResponse = {
	success: boolean;
	addToWalletUrl?: string;
	memberName?: string;
	error?: string;
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<PassResponse>,
) {
	if (req.method !== 'POST') {
		res.status(405).json({success: false, error: 'Method not allowed'});
		return;
	}

	const {email, pin} = req.body as PassRequest;

	if (!email || !pin) {
		res.status(400).json({success: false, error: 'Email and PIN are required'});
		return;
	}

	try {
		// Authenticate with PureGym
		const tokens = await authenticate(email, pin);

		// Get member info from token and QR code from API
		const memberInfo = getMemberInfoFromToken(tokens.accessToken);
		const qrCode = await getQrCode(tokens.accessToken);

		const memberName = `${memberInfo.firstName} ${memberInfo.lastName}`;

		// Check if user already exists
		const existingUser = getUser(email);

		// Create or update user record
		const user: StoredUser = {
			email,
			puregymAccessToken: tokens.accessToken,
			puregymRefreshToken: tokens.refreshToken,
			puregymTokenExpiresAt: tokens.expiresAt.toISOString(),
			walletPassObjectId: getObjectId(email),
			memberName,
			qrCodeData: qrCode.qrCode,
			qrCodeExpiresAt: qrCode.expiresAt.toISOString(),
			lastRefreshedAt: new Date().toISOString(),
			createdAt: existingUser?.createdAt || new Date().toISOString(),
		};

		saveUser(user);

		// Generate the Add to Wallet URL
		const addToWalletUrl = await createAddToWalletUrl({
			email: user.email,
			memberName: user.memberName,
			qrCode: qrCode.qrCode,
		});

		res.status(200).json({
			success: true,
			addToWalletUrl,
			memberName,
		});
	} catch (error) {
		console.error('Pass generation error:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Failed to generate pass',
		});
	}
}
