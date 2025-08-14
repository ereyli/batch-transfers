# 🚀 Sendwise: Smart Batch Transfers

A powerful batch transfer application for ETH and ERC20 tokens, optimized for L2 networks. Works both as a web application and Farcaster Mini App.

## ✨ Features

### 🌐 Multi-Platform Support
- **Web Application**: Full-featured web interface
- **Farcaster Mini App**: Native integration with Farcaster ecosystem
- **Mobile Optimized**: Responsive design for all devices

### 💰 Transfer Capabilities
- **ETH Transfers**: Native token batch transfers
- **ERC20 Transfers**: Token contract batch transfers
- **Multi-Network**: Support for 6 L2 networks
- **Gas Optimization**: Efficient batch processing

### 🔗 Wallet Integration
- **Farcaster Wallet**: Native Farcaster wallet support
- **MetaMask**: Traditional Web3 wallet support
- **Wallet Switching**: Seamless switching between wallet types

### 📊 Supported Networks
| Network | Chain ID | Status |
|---------|----------|--------|
| Base | 8453 | ✅ Active |
| Optimism | 10 | ✅ Active |
| Arbitrum | 42161 | ✅ Active |
| Soneium | 1868 | ✅ Active |
| Unichain | 130 | ✅ Active |
| Ink | 57073 | ✅ Active |

### 🎯 Farcaster Features
- **Native Notifications**: Push notifications for transfer status
- **Social Sharing**: Share transfer results to Farcaster
- **Wallet Integration**: Seamless Farcaster wallet connection
- **Mini App Optimization**: Optimized for Farcaster client experience

## 🚀 Quick Start

### Web Application
1. Visit [https://batch-transfers.vercel.app](https://batch-transfers.vercel.app)
2. Connect your MetaMask wallet
3. Select transfer type (ETH or ERC20)
4. Add recipient addresses and amounts
5. Execute batch transfer

### Farcaster Mini App
1. Open Farcaster client
2. Navigate to Mini Apps
3. Find "Sendwise: Smart Batch Transfers"
4. Connect Farcaster wallet
5. Start batch transferring

## 🛠️ Development

### Prerequisites
- Node.js 22.11.0 or higher
- npm, yarn, or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/ereyli/batch-transfers.git
cd batch-transfers

# Install dependencies
npm install

# Start development server
npm run dev
```

### Farcaster Development
```bash
# Enable Developer Mode in Farcaster
# Visit: https://farcaster.xyz/~/settings/developer-tools

# Preview Mini App
# Use Farcaster Developer Tools to preview your app
```

## 📁 Project Structure

```
batch-transfers/
├── index.html          # Main application file
├── manifest.json       # Farcaster Mini App manifest
├── package.json        # Project dependencies
├── funding.json        # Funding configuration
└── README.md          # Project documentation
```

## 🔧 Technical Details

### Smart Contracts
The application uses deployed batch transfer contracts on each supported network:

- **Base**: `0x74a2c6466d98253ca932fe6a6ccb811d4d7d5784`
- **Optimism**: `0x5e86e9cd50e7f64b692b90fae1487d2f6ed1aba9`
- **Arbitrum**: `0x5e86e9cd50e7f64b692b90fae1487d2f6ed1aba9`
- **Soneium**: `0x84e4dd821c8f848470fc49def3b14fc870fa97f0`
- **Unichain**: `0x84e4dd821c8f848470fc49def3b14fc870fa97f0`
- **Ink**: `0x84e4dd821c8f848470fc49def3b14fc870fa97f0`

### Fee Structure
- **Batch Transfer Fee**: 0.001 ETH per transaction
- **Gas Optimization**: Efficient batch processing reduces overall gas costs
- **Network Fees**: Standard network transaction fees apply

### Security Features
- **Address Validation**: All addresses are validated before processing
- **Amount Validation**: Proper decimal handling for all token types
- **Error Handling**: Comprehensive error handling and user feedback
- **Transaction Confirmation**: All transactions require user confirmation

## 🎨 UI/UX Features

### Design System
- **Color Scheme**: Dark theme with cyan accents
- **Typography**: Clean, readable fonts
- **Responsive**: Mobile-first design approach
- **Accessibility**: WCAG compliant interface

### User Experience
- **Loading States**: Clear feedback during operations
- **Error Messages**: Descriptive error handling
- **Success Feedback**: Confirmation of successful operations
- **Progress Indicators**: Real-time transaction status

## 🔌 API Integration

### Farcaster SDK
```javascript
import { sdk } from '@farcaster/miniapp-sdk';

// Initialize Farcaster Mini App
await sdk.initialize();

// Connect Farcaster wallet
const account = await sdk.wallet.connectFarcasterWallet();

// Send notifications
await sdk.notifications.sendNotification({
  title: 'Transfer Complete',
  body: 'Your batch transfer was successful!'
});
```

### Ethers.js Integration
```javascript
// Connect to Ethereum network
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Execute batch transfer
const contract = new ethers.Contract(contractAddress, abi, signer);
const tx = await contract.batchSend(recipients, amounts, { value: totalAmount });
```

## 🚀 Deployment

### Vercel Deployment
```bash
# Deploy to Vercel
npm run deploy
```

### Farcaster Publishing
1. Create manifest file (already included)
2. Submit for review through Farcaster Developer Tools
3. Wait for approval
4. App becomes available in Farcaster Mini Apps directory

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [https://miniapps.farcaster.xyz/docs](https://miniapps.farcaster.xyz/docs)
- **Issues**: [GitHub Issues](https://github.com/ereyli/batch-transfers/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ereyli/batch-transfers/discussions)

## 🙏 Acknowledgments

- [Farcaster](https://farcaster.xyz) for the Mini App platform
- [Ethers.js](https://ethers.org) for Web3 integration
- [Vercel](https://vercel.com) for hosting
- [IPFS](https://ipfs.io) for decentralized asset storage

---

**Made with ❤️ for the Farcaster community**
