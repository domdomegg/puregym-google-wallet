import {useState} from 'react';

const Home = () => {
	const [email, setEmail] = useState('');
	const [pin, setPin] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [walletUrl, setWalletUrl] = useState<string | null>(null);
	const [memberName, setMemberName] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const res = await fetch('/api/pass', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({email, pin}),
			});

			const data = await res.json();

			if (!data.success) {
				throw new Error(data.error || 'Failed to generate pass');
			}

			setWalletUrl(data.addToWalletUrl);
			setMemberName(data.memberName);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Something went wrong');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='min-h-screen bg-gray-100 py-12 px-4'>
			<div className='max-w-md mx-auto bg-white rounded-lg shadow-md p-8'>
				<h1 className='text-2xl font-bold text-center mb-2'>PureGym</h1>
				<p className='text-gray-600 text-center mb-8'>Google Wallet Pass</p>

				{!walletUrl
					? (
						<form onSubmit={handleSubmit} className='space-y-4'>
							<div>
								<label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-1'>
									Email
								</label>
								<input
									type='email'
									id='email'
									value={email}
									onChange={(e) => {
										setEmail(e.target.value);
									}}
									className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black'
									required
								/>
							</div>
							<div>
								<label htmlFor='pin' className='block text-sm font-medium text-gray-700 mb-1'>
									PIN (8 digits)
								</label>
								<input
									type='text'
									inputMode='numeric'
									id='pin'
									value={pin}
									onChange={(e) => {
										const value = e.target.value.replace(/\D/g, '').slice(0, 8);
										setPin(value);
									}}
									pattern='\d{8}'
									maxLength={8}
									placeholder='12345678'
									className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black font-mono tracking-widest'
									required
								/>
							</div>
							<button
								type='submit'
								disabled={loading || pin.length !== 8}
								className='w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 disabled:bg-gray-400 transition-colors'
							>
								{loading ? 'Generating...' : 'Get Wallet Pass'}
							</button>
						</form>
					)
					: (
						<div className='space-y-6'>
							<div className='text-center'>
								<p className='text-lg font-medium'>{memberName}</p>
								<p className='text-gray-600 text-sm mt-1'>Pass generated successfully</p>
							</div>

							<a
								href={walletUrl}
								target='_blank'
								rel='noopener noreferrer'
								className='block w-full bg-black text-white py-3 px-4 rounded-md text-center hover:bg-gray-800 transition-colors'
							>
								Add to Google Wallet
							</a>

							<button
								onClick={() => {
									setWalletUrl(null);
									setMemberName(null);
								}}
								className='w-full text-gray-600 py-2 px-4 hover:text-gray-800 transition-colors text-sm'
							>
								Generate another pass
							</button>
						</div>
					)}

				{error && (
					<div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-md'>
						<p className='text-red-700 text-sm'>{error}</p>
					</div>
				)}

				<p className='mt-8 text-xs text-gray-500 text-center'>
					Your pass will automatically update when the QR code changes.
				</p>
			</div>
		</div>
	);
};

export default Home;
