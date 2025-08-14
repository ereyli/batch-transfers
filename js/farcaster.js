// Farcaster Mini App SDK Integration
export class FarcasterManager {
  constructor() {
    this.isFarcasterMode = false;
    this.sdk = null;
  }

  // Initialize Farcaster Mini App
  async initialize() {
    try {
      // Try to load Farcaster SDK dynamically
      await this.loadFarcasterSDK();
      
      if (this.sdk && typeof this.sdk.isInFarcaster === 'function') {
        // Check if running in Farcaster environment
        const isInFarcaster = await this.sdk.isInFarcaster();
        
        if (isInFarcaster) {
          this.isFarcasterMode = true;
          this.showFarcasterInfo();
          this.showWalletSelector();
          
          // Initialize Farcaster SDK
          if (typeof this.sdk.initialize === 'function') {
            await this.sdk.initialize();
          }
          
          // Set up Farcaster wallet integration
          await this.setupFarcasterWallet();
          
          console.log('Farcaster Mini App initialized successfully');
        } else {
          console.log('Running in web mode');
          this.showWalletSelector(); // Show wallet selector in web mode too
        }
        
        // Hide loading screen and show app
        this.hideLoading();
        if (this.sdk.actions && typeof this.sdk.actions.ready === 'function') {
          await this.sdk.actions.ready();
        }
      } else {
        console.log('Farcaster SDK not available, running in web mode');
        this.showWalletSelector(); // Show wallet selector in web mode too
        this.hideLoading();
      }
      
    } catch (error) {
      console.error('Error initializing Farcaster:', error);
      // Fallback to web mode
      this.showWalletSelector(); // Show wallet selector in web mode too
      this.hideLoading();
    }
  }

  // Load Farcaster SDK dynamically
  async loadFarcasterSDK() {
    try {
      const { sdk } = await import('https://esm.sh/@farcaster/miniapp-sdk');
      this.sdk = sdk;
    } catch (error) {
      console.log('Farcaster SDK not available:', error.message);
      this.sdk = null;
    }
  }

  // Setup Farcaster wallet integration
  async setupFarcasterWallet() {
    try {
      if (!this.sdk) return;
      
      // Check if Farcaster wallet is available
      const hasFarcasterWallet = await this.sdk.wallet.hasFarcasterWallet();
      
      if (hasFarcasterWallet) {
        console.log('Farcaster wallet available');
      } else {
        console.log('Farcaster wallet not available');
      }
    } catch (error) {
      console.error('Error setting up Farcaster wallet:', error);
    }
  }

  // Switch to Farcaster wallet
  async switchToFarcasterWallet() {
    try {
      if (!this.sdk) {
        alert('Farcaster SDK not available. Please use MetaMask instead.');
        return null;
      }

      if (!this.isFarcasterMode) {
        alert('Farcaster wallet only available in Farcaster Mini App mode');
        return null;
      }

      const hasWallet = await this.sdk.wallet.hasFarcasterWallet();
      if (!hasWallet) {
        alert('Farcaster wallet not available');
        return null;
      }

      // Connect to Farcaster wallet
      const account = await this.sdk.wallet.connectFarcasterWallet();
      if (account) {
        console.log('Connected to Farcaster wallet:', account.address);
        return account;
      }
    } catch (error) {
      console.error('Error connecting to Farcaster wallet:', error);
      alert('Failed to connect to Farcaster wallet: ' + error.message);
    }
    return null;
  }

  // Send Farcaster notification
  async sendNotification(message) {
    if (this.isFarcasterMode && this.sdk) {
      try {
        await this.sdk.notifications.sendNotification({
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
    if (this.isFarcasterMode && this.sdk) {
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
