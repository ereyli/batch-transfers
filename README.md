# Sendwise: Smart Batch Transfers

A modern, modular web application and Farcaster Mini App for batch ETH and ERC20 token transfers with native Farcaster integration.

## 🚀 Features

- **Multi-Network Support**: Base, Optimism, Arbitrum, Soneium, Unichain, Ink
- **Dual Wallet Support**: MetaMask and Farcaster Wallet integration
- **Batch Transfers**: Send ETH or ERC20 tokens to multiple recipients in one transaction
- **CSV Import**: Import wallet addresses from CSV files
- **Modern UI**: Beautiful, responsive design with glassmorphism effects
- **Farcaster Integration**: Native Farcaster Mini App support with notifications and sharing
- **Wagmi Integration**: Type-safe wallet interactions for Farcaster Mini App
- **Viral Loop**: Built-in social sharing for app discovery
- **Gas Optimization**: Save up to 80% on gas fees compared to individual transfers

## 🚀 Features

- **Multi-Network Support**: Base, Optimism, Arbitrum, Soneium, Unichain, Ink
- **Dual Wallet Support**: MetaMask and Farcaster Wallet integration
- **Batch Transfers**: Send ETH or ERC20 tokens to multiple recipients in one transaction
- **CSV Import**: Import wallet addresses from CSV files
- **Modern UI**: Beautiful, responsive design with glassmorphism effects
- **Farcaster Integration**: Native Farcaster Mini App support with notifications and sharing

## 📁 Project Structure

```
batch-transfers/
├── index.html          # Main HTML file (clean, modular)
├── index-old.html      # Original monolithic HTML (backup)
├── styles/
│   └── main.css        # All CSS styles
├── js/
│   ├── config.js       # Configuration and constants
│   ├── app.js          # Main application class
│   ├── wallet.js       # Wallet management (MetaMask + Farcaster)
│   ├── farcaster.js    # Farcaster SDK integration
│   ├── ui.js           # UI management and event handling
│   └── blockchain.js   # Blockchain interactions and smart contracts
├── funding.json        # Project funding info
└── README.md           # This file
```

## 🏗️ Architecture

The project has been refactored from a single monolithic HTML file into a modular, maintainable structure:

### Core Modules

1. **Config (`config.js`)**: Contract addresses, ABIs, and app configuration
2. **App (`app.js`)**: Main application orchestrator
3. **Wallet (`wallet.js`)**: Wallet connection and management
4. **Farcaster (`farcaster.js`)**: Farcaster Mini App SDK integration
5. **UI (`ui.js`)**: User interface management and event handling
6. **Blockchain (`blockchain.js`)**: Smart contract interactions

### Benefits of Modular Structure

- **Maintainability**: Each module has a single responsibility
- **Reusability**: Components can be easily reused or modified
- **Debugging**: Easier to locate and fix issues
- **Testing**: Individual modules can be tested separately
- **Scalability**: Easy to add new features or modify existing ones

## 🛠️ Setup

1. Clone the repository
2. Open `index.html` in a web browser
3. Connect your wallet (MetaMask or Farcaster)
4. Start making batch transfers!

## 🔧 Development

### Adding New Features

1. **UI Changes**: Modify `styles/main.css` or `js/ui.js`
2. **Blockchain Logic**: Update `js/blockchain.js`
3. **Wallet Integration**: Modify `js/wallet.js` or `js/farcaster.js`
4. **Configuration**: Update `js/config.js`

### File Organization

- **CSS**: All styles are in `styles/main.css`
- **JavaScript**: Modular ES6 modules in `js/` directory
- **HTML**: Clean structure in `index.html`

## 🌐 Supported Networks

| Network | Chain ID | Contract Address |
|---------|----------|------------------|
| Base | 8453 | 0x74a2c6466d98253ca932fe6a6ccb811d4d7d5784 |
| Optimism | 10 | 0x5e86e9cd50e7f64b692b90fae1487d2f6ed1aba9 |
| Arbitrum | 42161 | 0x5e86e9cd50e7f64b692b90fae1487d2f6ed1aba9 |
| Soneium | 1868 | 0x84e4dd821c8f848470fc49def3b14fc870fa97f0 |
| Unichain | 130 | 0x84e4dd821c8f848470fc49def3b14fc870fa97f0 |
| Ink | 57073 | 0x84e4dd821c8f848470fc49def3b14fc870fa97f0 |

## 🎨 UI Features

- **Glassmorphism Design**: Modern glass-like UI elements
- **Responsive Layout**: Works on desktop and mobile
- **Smooth Animations**: CSS transitions and keyframe animations
- **Dark Theme**: Optimized for dark mode viewing
- **Loading States**: Professional loading screens and spinners

## 🌐 Live Demo

- **Web App**: https://www.sendwise.xyz
- **Farcaster Mini App**: Available in Warpcast App Store

## 📱 Farcaster Mini App Features

- ✅ **Native Wallet Integration**: No wallet selection dialogs
- ✅ **Batch Transactions**: EIP-5792 support for multiple operations
- ✅ **Auto-Connection**: Seamless wallet connection
- ✅ **Push Notifications**: Real-time transfer updates
- ✅ **Social Sharing**: Viral loop with custom embeds
- ✅ **Splash Screen**: Branded loading experience

## 🚀 Publishing to Farcaster

### 1. Domain Setup
- Choose a stable domain (e.g., `sendwise.app`)
- Ensure HTTPS is enabled
- Set up proper DNS records

### 2. Manifest File
The app includes a Farcaster manifest at `.well-known/farcaster.json`:

```json
{
  "miniapp": {
    "version": "1",
    "name": "Sendwise",
    "iconUrl": "https://bafybeigudidkz2nstogywhcb6gbwicvfdfqgkrdhjsnlvll5esa6hzic4e.ipfs.w3s.link/logo.png",
    "homeUrl": "https://www.sendwise.xyz",
    "primaryCategory": "finance",
    "requiredChains": ["eip155:8453", "eip155:10", "eip155:42161"],
    "requiredCapabilities": [
      "actions.signIn",
      "wallet.getEthereumProvider",
      "actions.signMessage",
      "actions.signTransaction",
      "actions.sendNotification"
    ]
  }
}
```

### 3. Verification
1. Visit https://farcaster.xyz/~/developers/mini-apps/manifest
2. Create a hosted manifest or use the local `.well-known/farcaster.json`
3. Verify domain ownership with signed message
4. Submit for review

### 4. Discovery
Once published, users can:
- Discover the app in Warpcast App Store
- Share transfer success in feeds
- Use native Farcaster wallet integration

## 🔗 Dependencies

- **Ethers.js**: Web3 library for Ethereum interactions
- **Farcaster Mini App SDK**: For Farcaster integration
- **Wagmi**: Type-safe wallet interactions
- **Viem**: Low-level Ethereum interface
- **Inter Font**: Modern typography from Google Fonts

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support or questions, please open an issue on GitHub.
