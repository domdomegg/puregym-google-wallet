# PureGym Google Wallet

Add your PureGym membership to Google Wallet. The pass automatically updates when your QR code changes.

Inspired by [Vadim Drobinin's Apple Wallet version](https://drobinin.com/posts/how-i-accidentally-became-puregyms-unofficial-apple-wallet-developer/).

## Features

- Enter your PureGym credentials to generate a Google Wallet pass
- Pass updates automatically when QR code changes (hourly refresh)

## Setup

### 1. Google Cloud Setup

```bash
gcloud projects create puregym-g-wallet --name="PureGym Google Wallet"
gcloud config set project puregym-g-wallet
gcloud services enable walletobjects.googleapis.com
gcloud iam service-accounts create wallet-issuer
gcloud iam service-accounts keys create service-account-key.json \
  --iam-account=wallet-issuer@puregym-g-wallet.iam.gserviceaccount.com
```

Then manually:
1. Go to [Google Wallet Console](https://pay.google.com/business/console/)
2. Create an Issuer account and note your **Issuer ID**
3. Add `wallet-issuer@puregym-g-wallet.iam.gserviceaccount.com` as a Developer

### 2. Environment Variables

```env
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
GOOGLE_WALLET_ISSUER_ID=3388000000012345678
DATA_DIR=/app/data
REFRESH_INTERVAL=0 * * * *  # Cron expression, default: every hour
```

### 3. Run with Docker

```bash
docker run -d \
  -p 3000:3000 \
  -v puregym-data:/app/data \
  -e GOOGLE_SERVICE_ACCOUNT_JSON='...' \
  -e GOOGLE_WALLET_ISSUER_ID='...' \
  ghcr.io/domdomegg/puregym-google-wallet:latest
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm start

# Build for production
npm run build

# Run production server
npm run serve
```

## Deployment

The Docker image is automatically built and pushed to `ghcr.io/domdomegg/puregym-google-wallet` on push to master.

For homelab deployment with k8s/Pulumi, add to your `appDefinitions.ts`:

```typescript
{
  name: 'puregym-google-wallet',
  image: 'ghcr.io/domdomegg/puregym-google-wallet:latest',
  port: 3000,
  env: {
    GOOGLE_SERVICE_ACCOUNT_JSON: '...',
    GOOGLE_WALLET_ISSUER_ID: '...',
  },
  volumes: [{
    name: 'data',
    mountPath: '/app/data',
  }],
}
```

## License

AGPL-3.0-only
