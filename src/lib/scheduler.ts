import cron from 'node-cron';
import {getAllUsers, updateUser} from './storage';
import {refreshAccessToken, getQrCode} from './puregym';
import {updatePass} from './wallet';

const REFRESH_INTERVAL = process.env.REFRESH_INTERVAL || '0 * * * *'; // Default: every hour

async function refreshUserPass(user: ReturnType<typeof getAllUsers>[number]): Promise<void> {
	try {
		console.log(`Refreshing pass for ${user.email}`);

		// Check if PureGym token needs refresh (refresh if expiring in next 10 minutes)
		let accessToken = user.puregymAccessToken;
		const tokenExpiry = new Date(user.puregymTokenExpiresAt);
		const tenMinutesFromNow = new Date(Date.now() + (10 * 60 * 1000));

		if (tokenExpiry < tenMinutesFromNow) {
			console.log(`Refreshing PureGym token for ${user.email}`);
			const newTokens = await refreshAccessToken(user.puregymRefreshToken);
			accessToken = newTokens.accessToken;

			updateUser(user.email, {
				puregymAccessToken: newTokens.accessToken,
				puregymRefreshToken: newTokens.refreshToken,
				puregymTokenExpiresAt: newTokens.expiresAt.toISOString(),
			});
		}

		// Fetch latest QR code
		const qrCode = await getQrCode(accessToken);

		// Check if QR code has changed
		if (qrCode.qrCode !== user.qrCodeData) {
			console.log(`QR code changed for ${user.email}, updating wallet pass`);

			// Update the stored QR code
			updateUser(user.email, {
				qrCodeData: qrCode.qrCode,
				qrCodeExpiresAt: qrCode.expiresAt.toISOString(),
				lastRefreshedAt: new Date().toISOString(),
			});

			// Update the Google Wallet pass
			if (user.walletPassObjectId) {
				await updatePass({
					email: user.email,
					memberName: user.memberName,
					qrCode: qrCode.qrCode,
				});
			}
		} else {
			// Just update the last refreshed timestamp
			updateUser(user.email, {
				lastRefreshedAt: new Date().toISOString(),
			});
		}

		console.log(`Successfully refreshed pass for ${user.email}`);
	} catch (error) {
		console.error(`Failed to refresh pass for ${user.email}:`, error);
	}
}

async function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function refreshAllPasses(): Promise<void> {
	console.log('Starting scheduled pass refresh...');
	const users = getAllUsers();

	// Process users sequentially to avoid rate limiting
	for (const user of users) {
		// eslint-disable-next-line no-await-in-loop
		await refreshUserPass(user);
		// eslint-disable-next-line no-await-in-loop
		await delay(1000);
	}

	console.log(`Completed refresh for ${users.length} users`);
}

let schedulerStarted = false;

export function startScheduler(): void {
	if (schedulerStarted) {
		console.log('Scheduler already started');
		return;
	}

	console.log(`Starting scheduler with interval: ${REFRESH_INTERVAL}`);

	cron.schedule(REFRESH_INTERVAL, () => {
		refreshAllPasses().catch(console.error);
	});

	schedulerStarted = true;
	console.log('Scheduler started');

	// Run an initial refresh after a short delay
	setTimeout(() => {
		refreshAllPasses().catch(console.error);
	}, 5000);
}

// Export for manual triggering
export {refreshAllPasses, refreshUserPass};
