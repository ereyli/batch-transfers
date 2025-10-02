// Farcaster Mini App SDK Integration
// Simplified per official Farcaster documentation

import { sdk } from '@farcaster/miniapp-sdk';

class FarcasterSDKManager {
  constructor() {
    this.sdk = null;
    this.isReady = false;
  }

  async initialize() {
    try {
      console.log('Initializing Farcaster SDK...');
      
      // Store SDK reference globally
      window.farcasterSDK = sdk;
      this.sdk = sdk;
      
      // Call ready() as required by official docs
      await sdk.actions.ready();
      console.log('✅ SDK ready() called - app is ready');
      
      this.isReady = true;
      
      // Hide loading screen and show content
      this.hideLoadingScreen();
      
      // Set Farcaster mode
      window.isFarcasterMiniApp = true;
      
      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('farcasterready', { detail: { sdk } }));
      
      // Try wallet auto-connection
      await this.tryWalletConnection();
      
      return true;
    } catch (error) {
      console.error('Error initializing Farcaster SDK:', error);
      window.isFarcasterMiniApp = false;
      return false;
    }
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
    
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.style.display = 'block';
    }
  }

  async tryWalletConnection() {
    try {
      console.log('Attempting Farcaster wallet connection...');
      
      // Try to get wallet from SDK
      if (this.sdk?.wallet?.getEthereumProvider) {
        const provider = await this.sdk.wallet.getEthereumProvider();
        if (provider) {
          const accounts = await provider.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            console.log('✅ Farcaster wallet connected:', accounts[0]);
            this.updateWalletUI(accounts[0]);
            return true;
          }
        }
      }
    } catch (error) {
      console.log('Wallet connection failed:', error.message);
    }
    return false;
  }

  updateWalletUI(address) {
    const walletBtn = document.getElementById('headerWalletBtn');
    if (walletBtn) {
      const shortAddress = address.slice(0, 6) + '...' + address.slice(-4);
      walletBtn.innerHTML = `<span style="color: white; font-size: 14px;">🟣 ${shortAddress}</span>`;
      walletBtn.style.background = 'linear-gradient(135deg, #6366f1, #8b5cf6)';
    }
  }
}

// Initialize when module loads
const farcasterManager = new FarcasterSDKManager();

// Auto-initialize
(async () => {
  await farcasterManager.initialize();
})();

// Export for global access
window.FarcasterSDKManager = FarcasterSDKManager;
window.farcasterManager = farcasterManager;
