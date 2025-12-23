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
		<div style={{
			minHeight: '100vh',
			background: '#f0f4f8',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			padding: '2rem',
			fontFamily: '\'Google Sans\', \'Segoe UI\', system-ui, sans-serif',
		}}>
			{/* Decorative background cards */}
			<div style={{
				position: 'fixed',
				top: '10%',
				left: '5%',
				width: '40vw',
				height: '20vw',
				background: 'linear-gradient(135deg, #00c1c6 0%, #00999d 100%)',
				borderRadius: '12px',
				opacity: 0.12,
				transform: 'rotate(-12deg)',
			}} />
			<div style={{
				position: 'fixed',
				bottom: '15%',
				right: '8%',
				width: '35vw',
				height: '17.5vw',
				background: 'linear-gradient(135deg, #00999d 0%, #007a7d 100%)',
				borderRadius: '12px',
				opacity: 0.1,
				transform: 'rotate(8deg)',
			}} />

			<div style={{
				position: 'relative',
				width: '100%',
				maxWidth: '380px',
			}}>

				{/* Pass card preview - full width */}
				<div style={{
					background: '#202020',
					borderRadius: '12px',
					padding: '1rem 1.25rem',
					marginBottom: '1.5rem',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}>
					<div>
						<div style={{
							fontSize: '0.65rem',
							color: 'rgba(255,255,255,0.5)',
							letterSpacing: '0.1em',
							textTransform: 'uppercase',
							marginBottom: '0.2rem',
						}}>
							Membership
						</div>
						<div style={{
							fontSize: '1.2rem',
							fontWeight: 600,
							color: '#fff',
							letterSpacing: '-0.01em',
						}}>
							PureGym
						</div>
					</div>
					<img
						src='https://www.puregym.com/BrowserIcons/favicon.ico'
						alt='PureGym'
						style={{
							width: '48px',
							height: '48px',
							borderRadius: '10px',
							objectFit: 'cover',
						}}
					/>
				</div>

				{/* Main card containing everything */}
				<div style={{
					background: '#fff',
					borderRadius: '20px',
					padding: '1.75rem',
					boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
				}}>

					{/* Header */}
					<h1 style={{
						fontSize: '1.5rem',
						fontWeight: 600,
						color: '#1a1a2e',
						textAlign: 'center',
						margin: 0,
					}}>
						Add to Google Wallet
					</h1>

					{!walletUrl ? (
						<>
							<p style={{
								fontSize: '0.875rem',
								color: '#6b7280',
								marginBottom: '1.25rem',
								textAlign: 'center',
							}}>
								Enter your PureGym credentials
							</p>

							<form onSubmit={handleSubmit}>
								<div style={{marginBottom: '1rem'}}>
									<label style={{
										display: 'block',
										color: '#374151',
										fontSize: '0.875rem',
										fontWeight: 500,
										marginBottom: '0.4rem',
									}}>
										Email
										<input
											type='email'
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder='you@example.com'
											required
											style={{
												width: '100%',
												padding: '0.75rem 1rem',
												background: '#f9fafb',
												border: '2px solid #e5e7eb',
												borderRadius: '10px',
												color: '#111',
												fontSize: '1rem',
												outline: 'none',
												boxSizing: 'border-box',
												transition: 'border-color 0.2s',
												marginTop: '0.25rem',
											}}
										/>
									</label>
								</div>

								<div style={{marginBottom: '1.5rem'}}>
									<label style={{
										display: 'block',
										color: '#374151',
										fontSize: '0.875rem',
										fontWeight: 500,
										marginBottom: '0.4rem',
									}}>
										PIN
										<input
											type='text'
											inputMode='numeric'
											value={pin}
											onChange={(e) => {
												const value = e.target.value.replace(/\D/g, '').slice(0, 8);
												setPin(value);
											}}
											placeholder='8-digit PIN'
											pattern='\d{8}'
											maxLength={8}
											required
											style={{
												width: '100%',
												padding: '0.75rem 1rem',
												background: '#f9fafb',
												border: '2px solid #e5e7eb',
												borderRadius: '10px',
												color: '#111',
												fontSize: '1rem',
												fontFamily: 'monospace',
												letterSpacing: '0.25em',
												outline: 'none',
												boxSizing: 'border-box',
												marginTop: '0.25rem',
											}}
										/>
									</label>
								</div>

								<button
									type='submit'
									disabled={loading || pin.length !== 8}
									style={{
										width: '100%',
										padding: '0.875rem',
										background: loading || pin.length !== 8 ? '#9ca3af' : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
										border: 'none',
										borderRadius: '10px',
										color: '#fff',
										fontSize: '1rem',
										fontWeight: 600,
										cursor: loading || pin.length !== 8 ? 'not-allowed' : 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '0.5rem',
										boxShadow: '0 2px 8px rgba(26, 26, 46, 0.2)',
									}}
								>
									<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
										<rect x='2' y='5' width='20' height='14' rx='2' />
										<line x1='2' y1='10' x2='22' y2='10' />
									</svg>
									{loading ? 'Generating...' : 'Generate Pass'}
								</button>
							</form>

							{error && (
								<div style={{
									marginTop: '1rem',
									padding: '0.75rem',
									background: '#fef2f2',
									border: '1px solid #fecaca',
									borderRadius: '8px',
								}}>
									<p style={{
										color: '#dc2626',
										fontSize: '0.875rem',
										margin: 0,
									}}>{error}</p>
								</div>
							)}
						</>
					) : (
						<>
							<p style={{
								fontSize: '0.875rem',
								color: '#6b7280',
								marginBottom: '1.25rem',
								textAlign: 'center',
							}}>
								Pass ready for {memberName}
							</p>

							<a
								href={walletUrl}
								target='_blank'
								rel='noopener noreferrer'
								style={{
									width: '100%',
									padding: '0.875rem',
									background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
									border: 'none',
									borderRadius: '10px',
									color: '#fff',
									fontSize: '1rem',
									fontWeight: 600,
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: '0.5rem',
									boxShadow: '0 2px 8px rgba(26, 26, 46, 0.2)',
									textDecoration: 'none',
									boxSizing: 'border-box',
								}}
							>
								<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
									<rect x='2' y='5' width='20' height='14' rx='2' />
									<line x1='2' y1='10' x2='22' y2='10' />
								</svg>
								Add to Google Wallet
							</a>

							<button
								onClick={() => {
									setWalletUrl(null);
									setMemberName(null);
									setEmail('');
									setPin('');
								}}
								style={{
									width: '100%',
									marginTop: '1rem',
									padding: '0.5rem',
									background: 'transparent',
									border: 'none',
									color: '#6b7280',
									fontSize: '0.875rem',
									cursor: 'pointer',
								}}
							>
								Generate another pass
							</button>
						</>
					)}

					{/* Unofficial disclaimer */}
					<div style={{
						marginTop: '1.5rem',
						textAlign: 'center',
					}}>
						<p style={{
							color: '#9ca3af',
							fontSize: '0.7rem',
							margin: 0,
						}}>
							Unofficial project · Not affiliated with PureGym
						</p>
						<a
							href='https://github.com/domdomegg/puregym-google-wallet'
							target='_blank'
							rel='noopener noreferrer'
							style={{
								color: '#00999d',
								fontSize: '0.7rem',
								textDecoration: 'none',
								marginTop: '0.25rem',
								display: 'inline-block',
							}}
						>
							View on GitHub →
						</a>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Home;
