export async function register() {
	// Only run scheduler in Node.js runtime (not Edge)
	if (process.env.NEXT_RUNTIME === 'nodejs') {
		const {startScheduler} = await import('./lib/scheduler');
		startScheduler();
	}
}
