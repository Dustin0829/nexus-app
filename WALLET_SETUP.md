# Wallet Connection Setup

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# WalletConnect Project ID (get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# Solana RPC URL (optional - defaults to public endpoint)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Irys Network Configuration
NEXT_PUBLIC_IRYS_NETWORK=mainnet
NEXT_PUBLIC_IRYS_TOKEN=ethereum
```

## WalletConnect Setup

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy your Project ID
4. Add it to your `.env.local` file

## Supported Wallets

### Ethereum
- MetaMask
- WalletConnect compatible wallets
- Injected wallets (Brave, etc.)

### Solana
- Phantom
- Other Solana wallet adapters can be added

## Testing

1. Start the development server: `npm run dev`
2. Open the app in your browser
3. Click "Connect Wallet" in the header
4. Choose your preferred wallet
5. Approve the connection

## Features

- ✅ Real wallet connection for Ethereum and Solana
- ✅ Wallet address display and copying
- ✅ Network detection and display
- ✅ Disconnect functionality
- ✅ Connection status persistence
- ✅ Conditional UI based on connection status
