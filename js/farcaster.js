// Farcaster Mini App SDK Integration
export class FarcasterManager {
  constructor() {
    this.isFarcasterMode = false;
    this.sdk = null;
  }

  // Initialize Farcaster Mini App
  async initialize() {
    try {
      console.log('Initializing Farcaster Mini App...');
      
      // Check if we're in Farcaster Mini App environment
      if (window.isFarcasterMiniApp) {
        this.isFarcasterMode = true;
        this.sdk = null;
        
        console.log('Running in Farcaster Mini App environment');
        
        // Show Farcaster info
        this.showFarcasterInfo();
        this.showWalletSelector();
        
        console.log('Farcaster Mini App initialized successfully');
      } else {
        console.log('Running in web mode');
        this.showWalletSelector(); // Show wallet selector in web mode too
      }
      
      // Hide loading screen and show app
      this.hideLoading();
      
    } catch (error) {
      console.error('Error initializing Farcaster:', error);
      // Fallback to web mode
      this.showWalletSelector(); // Show wallet selector in web mode too
      this.hideLoading();
    }
  }

  // Switch to Farcaster wallet (now handled by Wagmi)
  async switchToFarcasterWallet() {
    try {
      if (!this.isFarcasterMode) {
        if (window.uiManager) {
          window.uiManager.updateStatus('Farcaster wallet is only available inside Farcaster.', false, true);
        }
        return null;
      }

      // In Farcaster Mini App, wallet connection is handled by Wagmi
      if (window.wagmiClient) {
        try {
          const { data: account } = await window.wagmiClient.getAccount();
          if (account && account.address) {
            console.log('Connected to Farcaster wallet:', account.address);
            return account;
          } else {
            // Try to connect
            const { data: connectedAccount } = await window.wagmiClient.connect();
            if (connectedAccount && connectedAccount.address) {
              console.log('Connected to Farcaster wallet:', connectedAccount.address);
              return connectedAccount;
            }
          }
        } catch (error) {
          console.error('Error connecting to Farcaster wallet:', error);
        }
      }
      
      if (window.uiManager) {
        window.uiManager.updateStatus('Farcaster wallet not available', false, true);
      }
      return null;
    } catch (error) {
      console.error('Error switching to Farcaster wallet:', error);
      if (window.uiManager) {
        window.uiManager.updateStatus('Failed to connect to Farcaster wallet: ' + error.message, false, true);
      }
    }
    return null;
  }

  // Send Farcaster notification
  async sendNotification(message) {
    // SDK removed: no-op
  }

  // Share to Farcaster
  async shareToFarcaster() {
    // SDK removed: no-op
  }

  // Show Farcaster info
  showFarcasterInfo() {
    const farcasterInfo = document.getElementById('farcasterInfo');
    if (farcasterInfo) {
      farcasterInfo.style.display = 'block';
    }
  }

  // Show wallet selector
  showWalletSelector() {
    const walletSelector = document.getElementById('walletSelector');
    if (walletSelector) {
      walletSelector.style.display = 'flex';
    }
  }

  // Hide loading screen
  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
    
    // Always show wallet selector
    this.showWalletSelector();
  }

  // Get Farcaster mode status
  getIsFarcasterMode() {
    return this.isFarcasterMode;
  }

  // Setup event listeners
  setupEventListeners() {
    // SDK removed: no-op
  }
}
