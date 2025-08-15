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
      let isInFarcaster = false;
      
      // Method 1: Check for Farcaster SDK
      if (window.FarcasterMiniAppSDK) {
        try {
          const sdk = window.FarcasterMiniAppSDK;
          const isInFarcasterEnv = await sdk.isInFarcaster();
          if (isInFarcasterEnv) {
            isInFarcaster = true;
            this.sdk = sdk;
            console.log('Farcaster SDK detected and environment confirmed');
          }
        } catch (error) {
          console.log('Farcaster SDK check failed:', error.message);
        }
      }
      
      // Method 2: Check URL and user agent
      if (!isInFarcaster) {
        if (window.location.href.includes('farcaster') || 
            window.location.href.includes('warpcast') ||
            window.navigator.userAgent.includes('Farcaster') ||
            window.navigator.userAgent.includes('Warpcast')) {
          isInFarcaster = true;
          console.log('Farcaster environment detected via URL/User Agent');
        }
      }
      
      this.isFarcasterMode = isInFarcaster;
      
      if (isInFarcaster) {
        console.log('Running in Farcaster Mini App environment');
        
        // Show Farcaster info
        this.showFarcasterInfo();
        this.showWalletSelector();
        
        // Initialize Farcaster SDK if available
        if (this.sdk && typeof this.sdk.initialize === 'function') {
          try {
            await this.sdk.initialize();
            console.log('Farcaster SDK initialized');
          } catch (error) {
            console.warn('Error initializing Farcaster SDK:', error);
          }
        }
        
        // Call ready() if available
        if (this.sdk && this.sdk.actions && typeof this.sdk.actions.ready === 'function') {
          try {
            await this.sdk.actions.ready();
            console.log('Farcaster SDK ready() called');
          } catch (error) {
            console.warn('Error calling sdk.actions.ready():', error);
          }
        }
        
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
        alert('Farcaster wallet only available in Farcaster Mini App mode');
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
      
      alert('Farcaster wallet not available');
      return null;
    } catch (error) {
      console.error('Error switching to Farcaster wallet:', error);
      alert('Failed to connect to Farcaster wallet: ' + error.message);
    }
    return null;
  }

  // Send Farcaster notification
  async sendNotification(message) {
    if (this.isFarcasterMode && this.sdk && this.sdk.actions) {
      try {
        await this.sdk.actions.sendNotification({
          title: 'Sendwise Batch Transfer',
          body: message,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sending Farcaster notification:', error);
      }
    }
  }

  // Share to Farcaster
  async shareToFarcaster() {
    if (this.isFarcasterMode && this.sdk && this.sdk.actions) {
      try {
        await this.sdk.actions.share({
          text: 'Just completed a batch transfer with Sendwise! 🚀',
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing to Farcaster:', error);
      }
    }
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
    if (this.sdk && this.sdk.events && typeof this.sdk.events.on === 'function') {
      this.sdk.events.on('walletConnected', (account) => {
        console.log('Wallet connected:', account);
        // You can emit a custom event here if needed
        window.dispatchEvent(new CustomEvent('farcasterWalletConnected', { detail: account }));
      });

      this.sdk.events.on('walletDisconnected', () => {
        console.log('Wallet disconnected');
        window.dispatchEvent(new CustomEvent('farcasterWalletDisconnected'));
      });
    }
  }
}
