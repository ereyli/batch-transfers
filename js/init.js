// Sendwise App Initialization Logic

class SendwiseInitializer {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('Initializing Sendwise app...');
      
      // Ensure wallet button is visible immediately
      this.ensureWalletButtonVisible();
      
      // Check for pending batch transfers from share
      setTimeout(() => this.checkPendingBatchTransfer(), 1000);
      
      // Determine environment (Farcaster vs Web)
      const isFarcasterInitialized = await this.initializeFarcasterSDK();
      
      console.log('Environment determined:', {
        isFarcaster: window.isFarcasterMiniApp,
        sdkInitialized: isFarcasterInitialized
      });

      // Setup network tag handlers
      this.setupNetworkTags();
      
      // Initialize Sendwise app
      await this.initializeSendwiseApp();
      
      // Hide loading screen
      this.hideLoadingScreen();
      
      this.isInitialized = true;
      console.log('Sendwise app initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.hideLoadingScreen();
      
      if (!window.isFarcasterMiniApp && window.uiManager) {
        window.uiManager.updateStatus('Failed to initialize. Please refresh the page.', false, true);
      }
    }
  }

  async initializeFarcasterSDK() {
    // This will be handled by farcaster-sdk.js module
    // Just detect environment here
    const userAgent = navigator.userAgent || '';
    const referrer = document.referrer || '';
    
    const isFarcasterUA = userAgent.toLowerCase().includes('farcaster') || 
                         userAgent.toLowerCase().includes('warpcast');
    const isFarcasterReferrer = referrer.includes('warpcast.com') || 
                               referrer.includes('farcaster.xyz');
    const isInFrame = window !== window.top;
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    const isFarcaster = (isFarcasterUA && isFarcasterReferrer) || 
                       (isFarcasterUA && isInFrame) || 
                       (isMobile && isFarcasterUA);
    
    window.isFarcasterMiniApp = isFarcaster;
    
    if (isFarcaster) {
      console.log('Farcaster environment detected');
      this.setupFarcasterUI();
    } else {
      console.log('Web environment detected');
    }
    
    return isFarcaster;
  }

  async initializeSendwiseApp() {
    console.log('Creating SendwiseApp...');
    
    if (typeof window.SendwiseApp !== 'function') {
      console.error('SendwiseApp class not loaded!');
      throw new Error('SendwiseApp class not available');
    }
    
    const app = new window.SendwiseApp();
    window.sendwiseApp = app;
    
    // Setup wallet manager
    if (!window.isFarcasterMiniApp) {
      console.log('Web mode - setting up wallet manager directly');
      const walletManager = app.getWalletManager();
      if (walletManager) {
        window.walletManager = walletManager;
        console.log('WalletManager successfully assigned for web');
      }
    } else {
      console.log('Farcaster mode - wallet manager will be setup by Farcaster logic');
    }
    
    // Ensure wallet button is still visible after app initialization
    setTimeout(() => this.ensureWalletButtonVisible(), 100);
  }

  setupNetworkTags() {
    // Default selected chain is Base
    if (!window.selectedChainId) {
      window.selectedChainId = 8453;
    }
    
    const container = document.getElementById('networkTags');
    if (!container) return;
    
    const tags = container.querySelectorAll('.network-tag');

    const highlightSelected = () => {
      tags.forEach(tag => {
        const isActive = Number(tag.dataset.chain) === Number(window.selectedChainId);
        tag.style.background = isActive ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255,255,255,0.06)';
        tag.style.border = isActive ? '1px solid rgba(102,126,234,0.8)' : '1px solid rgba(255,255,255,0.2)';
      });
    };

    const trySwitchChain = async (chainId) => {
      try {
        if (window.wagmiClient && typeof window.wagmiClient.switchChain === 'function') {
          await window.wagmiClient.switchChain({ chainId });
          console.log('Switched chain via Wagmi to', chainId);
          return true;
        }
      } catch (err) {
        console.warn('switchChain not available or failed:', err);
      }
      return false;
    };

    tags.forEach(tag => {
      tag.addEventListener('click', async () => {
        const chainId = Number(tag.dataset.chain);
        window.selectedChainId = chainId;
        highlightSelected();
        await trySwitchChain(chainId);
        
        // Update wallet manager if available
        if (window.walletManager && typeof window.walletManager.updateMainConnectButton === 'function') {
          const address = await (window.walletManager.getAddress?.() || Promise.resolve(''));
          const networkNameMap = { 8453: 'Base', 10: 'Optimism', 42161: 'Arbitrum', 1868: 'Soneium', 130: 'Unichain', 57073: 'Ink' };
          const networkName = networkNameMap[chainId] || 'Network';
          window.walletManager.updateMainConnectButton(address || '', 'Farcaster Wallet', networkName, 'farcaster');
        }
      });
    });

    // Initial highlight
    highlightSelected();
  }

  setupFarcasterUI() {
    // Keep wallet button visible in Farcaster Mini App
    const walletButtonContainer = document.getElementById('walletButtonContainer');
    if (walletButtonContainer) {
      walletButtonContainer.style.display = 'block';
    }
    
    // Adjust header for mobile
    const header = document.querySelector('.header');
    if (header) {
      header.style.paddingTop = '60px';
    }
    
    // Add Farcaster-specific styles
    const style = document.createElement('style');
    style.textContent = `
      .farcaster-mode .header {
        padding-top: 60px;
      }
      
      .farcaster-mode .container {
        max-width: 100%;
        padding: 0 16px;
      }
      
      .farcaster-mode .main-form {
        margin-top: 20px;
      }
      
      .farcaster-mode button {
        min-height: 44px;
        touch-action: manipulation;
      }
      
      .farcaster-mode input {
        min-height: 44px;
        touch-action: manipulation;
      }
    `;
    document.head.appendChild(style);
    
    // Add Farcaster mode class to body
    document.body.classList.add('farcaster-mode');
  }

  checkPendingBatchTransfer() {
    try {
      const pendingData = localStorage.getItem('pendingBatchTransfer');
      if (pendingData) {
        const data = JSON.parse(pendingData);
        console.log('Found pending batch transfer from cast share:', data);
        
        localStorage.removeItem('pendingBatchTransfer');
        window.selectedChainId = data.chainId;
        
        // Populate recipients if available
        if (data.recipients && data.recipients.length > 0) {
          // Implementation would go here
          console.log('Would populate recipients:', data.recipients);
        }
      }
    } catch (error) {
      console.log('Error checking pending batch transfer:', error);
    }
  }

  ensureWalletButtonVisible() {
    const walletButtonContainer = document.getElementById('walletButtonContainer');
    if (walletButtonContainer) {
      walletButtonContainer.style.display = 'block';
      console.log('Wallet button made visible');
    }
  }

  hideLoadingScreen() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
      console.log('Loading screen hidden');
    }
  }
}

// Global wallet modal function
window.openWalletModal = () => {
  console.log('openWalletModal called');
  
  if (window.walletManager && typeof window.walletManager.showModernWalletModal === 'function') {
    console.log('Using global WalletManager...');
    window.walletManager.showModernWalletModal();
  } else if (window.sendwiseApp && window.sendwiseApp.getWalletManager()) {
    console.log('Using SendwiseApp WalletManager...');
    window.sendwiseApp.getWalletManager().showModernWalletModal();
  } else {
    console.error('WalletManager not available. Retrying in 1 second...');
    
    setTimeout(() => {
      if (window.walletManager && typeof window.walletManager.showModernWalletModal === 'function') {
        console.log('Retry successful - using WalletManager');
        window.walletManager.showModernWalletModal();
      } else {
        console.error('WalletManager still not available after retry');
        alert('Wallet connection system loading. Please refresh the page and try again.');
      }
    }, 1000);
  }
};

// Initialize when DOM is loaded
const initializer = new SendwiseInitializer();

window.addEventListener('DOMContentLoaded', async function() {
  await initializer.initialize();
});

// Export for global access
window.SendwiseInitializer = SendwiseInitializer;
window.sendwiseInitializer = initializer;
