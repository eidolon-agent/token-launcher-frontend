# Token Launcher Frontend

Next.js 14 + wagmi + viem frontend for the ERC-20 token on Base Mainnet.

## Features

- Connect wallet (Base mainnet)
- View total supply and owner
- Mint (owner only), Burn, Transfer
- Simple UI with Tailwind CSS

## Setup

1. Copy `.env.local.example` to `.env.local` and fill:
   - `NEXT_PUBLIC_RPC_URL`: Base Mainnet RPC (default provided)
   - `NEXT_PUBLIC_TOKEN_ADDRESS`: Deployed Token contract address (from `token-launcher`)

2. Install deps (already done if following from build):
   ```bash
   npm install
   ```

3. Run dev server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Production Build

```bash
npm run build
npm start
```

## Deploy to Vercel

Import the repo and set environment variables in Vercel project settings.
