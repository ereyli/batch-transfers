import { WalletManager } from './wallet.js';
import { UIManager } from './ui.js';
import { BlockchainManager } from './blockchain.js';

export class SendwiseApp {
  constructor() {
    this.walletManager = new WalletManager();
    this.uiManager = new UIManager();
    this.blockchainManager = new BlockchainManager(this.walletManager, this.uiManager);
    
    // Global references for HTML onclick handlers
    window.uiManager = this.uiManager;
    window.walletManager = this.walletManager;
    window.blockchainManager = this.blockchainManager;
    
    console.log('SendwiseApp: Global wallet manager exposed immediately for Farcaster SDK access');
    
    // Setup global handlers immediately
    this.setupGlobalHandlers();
    
    // Initialize after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.initialize();
    }, 100);
  }

  async initialize() {
    try {
      // Always show loading initially, will be hidden by Farcaster SDK or timeout
      this.uiManager.showLoading();
      
      // Enhanced Farcaster Mini App detection and initialization
      const isFarcasterContext = this.detectFarcasterContext();
      console.log('Detection result:', isFarcasterContext);
      
      window.isFarcasterMiniApp = isFarcasterContext;
      
      if (isFarcasterContext) {
        console.log('Farcaster context detected - initializing...');
        try {
          await this.initializeFarcasterApp();
          console.log('Farcaster app initialization completed');
        } catch (error) {
          console.error('Farcaster app initialization failed:', error);
        }
      } else {
        console.log('Not Farcaster context - continuing with normal web initialization');
      }
      
      // Initialize wallet manager (includes Farcaster)
      await this.walletManager.initialize();
      
      // If in Farcaster Mini App, force auto-connect to Farcaster wallet
      if (window.isFarcasterMiniApp) {
        console.log('Farcaster Mini App detected - forcing wallet connection');
        try {
          // Wait a bit for Farcaster SDK to be fully ready
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          await this.walletManager.initializeFarcasterMiniAppWallet();
          console.log('Farcaster wallet auto-connected successfully');
          
          // Update UI to show connected state
          if (this.walletManager.getSigner()) {
            const address = await this.walletManager.getSigner().getAddress();
            console.log('Wallet connected:', address);
            
                      // Update UI immediately
          if (this.uiManager && typeof this.uiManager.updateWalletDisplay === 'function') {
            this.uiManager.updateWalletDisplay(address, 'Farcaster Wallet', 'Farcaster', 'farcaster');
          } else {
            console.log('UI Manager updateWalletDisplay method not available');
          }
          }
        } catch (error) {
          console.error('Failed to auto-connect Farcaster wallet:', error);
          // Don't show error to user in Farcaster Mini App
          // But try to continue with the app
          
          // Try alternative connection methods
          try {
            console.log('Trying alternative connection methods...');
            
            // Try to get wallet from global context
            if (window.wagmiClient) {
              const { data: account } = await window.wagmiClient.getAccount();
              if (account && account.address) {
                console.log('Alternative connection successful:', account.address);
                this.uiManager.updateWalletDisplay(account.address, 'Farcaster Wallet', 'Farcaster', 'farcaster');
              }
            }
          } catch (altError) {
            console.warn('Alternative connection also failed:', altError);
          }
        }
      }
      
      // Initialize UI
      this.uiManager.onTransferTypeChange();
      this.uiManager.updateRemoveButtons();
      
      // Track app engagement for Farcaster search ranking
      this.trackAppEngagement();
      
      // Hide loading screen only for web browser
      if (!window.isFarcasterMiniApp) {
        this.uiManager.hideLoading();
      }
      
    } catch (error) {
      console.error('Error initializing app:', error);
      if (!window.isFarcasterMiniApp) {
        this.uiManager.hideLoading();
      }
    }
  }

  // Track app engagement for Farcaster search ranking
  trackAppEngagement() {
    try {
      // Track app open
      this.trackEvent('app_opened');
      
      // Track wallet connection
      if (this.walletManager.getSigner()) {
        this.trackEvent('wallet_connected');
      }
      
      // Track user interactions
      document.addEventListener('click', (e) => {
        if (e.target.matches('button')) {
          this.trackEvent('button_clicked', { button: e.target.textContent });
        }
      });
      
      // Track form interactions
      document.addEventListener('input', (e) => {
        if (e.target.matches('input')) {
          this.trackEvent('form_interaction', { field: e.target.name || 'unknown' });
        }
      });
      
      // Track successful transfers
      if (window.blockchainManager) {
        const originalUpdateStatus = window.blockchainManager.uiManager.updateStatus.bind(window.blockchainManager.uiManager);
        window.blockchainManager.uiManager.updateStatus = (message, isSuccess, isError) => {
          if (isSuccess && message.includes('completed successfully')) {
            this.trackEvent('transfer_completed');
          }
          return originalUpdateStatus(message, isSuccess, isError);
        };
      }
      
    } catch (error) {
      console.error('Error tracking app engagement:', error);
    }
  }

  // Track events for analytics
  trackEvent(eventName, data = {}) {
    try {
      // Send to Farcaster if in Mini App mode
      if (window.isFarcasterMiniApp && window.farcasterSDK) {
        // Farcaster tracks engagement automatically
        console.log('Farcaster engagement tracked:', eventName, data);
      }
      
      // Send to analytics service
      if (window.gtag) {
        window.gtag('event', eventName, {
          event_category: 'sendwise_app',
          event_label: window.isFarcasterMiniApp ? 'farcaster_mini_app' : 'web_app',
          ...data
        });
      }
      
      // Log for debugging
      console.log('App engagement tracked:', eventName, data);
      
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  setupGlobalHandlers() {
    // Global wallet modal function
    window.openWalletModal = () => {
      if (this.walletManager) {
        this.walletManager.showModernWalletModal();
      } else {
        console.error('Wallet manager not initialized');
      }
    };



    // Global blockchain functions
    window.fetchTokenInfo = async () => {
      try {
        await this.blockchainManager.fetchTokenInfo();
      } catch (error) {
        console.error('Error fetching token info:', error);
      }
    };

    window.approveToken = async () => {
      try {
        await this.blockchainManager.approveToken();
      } catch (error) {
        console.error('Error approving token:', error);
      }
    };

    window.sendBatch = async () => {
      try {
        await this.blockchainManager.sendBatch();
      } catch (error) {
        console.error('Error sending batch:', error);
      }
    };

    // Global UI functions
    window.addInput = () => {
      try {
        this.uiManager.addInput();
      } catch (error) {
        console.error('Error adding input:', error);
      }
    };

    window.removeLast = () => {
      try {
        this.uiManager.removeLast();
      } catch (error) {
        console.error('Error removing last:', error);
      }
    };

    window.importWallets = () => {
      try {
        this.uiManager.importWallets();
      } catch (error) {
        console.error('Error importing wallets:', error);
      }
    };

    // Enhanced status update with Farcaster notifications
    const originalUpdateStatus = this.uiManager.updateStatus.bind(this.uiManager);
    this.uiManager.updateStatus = (message, isSuccess = false, isError = false) => {
      originalUpdateStatus(message, isSuccess, isError);
      
      // Send Farcaster notification on success
      if (isSuccess && this.walletManager.getFarcasterManager().getIsFarcasterMode()) {
        this.walletManager.getFarcasterManager().sendNotification(message);
      }
    };

    // Farcaster event listeners
    window.addEventListener('farcasterWalletConnected', (event) => {
      this.uiManager.updateStatus('Farcaster wallet connected successfully', true, false);
    });

    window.addEventListener('farcasterWalletDisconnected', () => {
      this.uiManager.updateStatus('Farcaster wallet disconnected', false, false);
    });
  }

  // Get managers for external access
  getWalletManager() {
    return this.walletManager;
  }

  getUIManager() {
    return this.uiManager;
  }

  getBlockchainManager() {
    return this.blockchainManager;
  }

  // Enhanced Farcaster detection method
  detectFarcasterContext() {
    // Check multiple indicators for Farcaster context
    const userAgent = navigator.userAgent || '';
    const referrer = document.referrer || '';
    
    // Check for Farcaster user agent patterns
    const farcasterUserAgents = [
      'farcaster',
      'warpcast',
      'FarcasterMobile',
      'Warpcast'
    ];
    
    const isFarcasterUA = farcasterUserAgents.some(ua => 
      userAgent.toLowerCase().includes(ua.toLowerCase())
    );
    
    // Check for Farcaster referrer patterns
    const farcasterReferrers = [
      'warpcast.com',
      'farcaster.xyz',
      'client.farcaster.xyz'
    ];
    
    const isFarcasterReferrer = farcasterReferrers.some(ref => 
      referrer.toLowerCase().includes(ref.toLowerCase())
    );
    
    // Check for URL parameters that indicate Farcaster
    const urlParams = new URLSearchParams(window.location.search);
    const hasFarcasterParam = urlParams.has('fc') || urlParams.has('farcaster') || urlParams.has('frame');
    
    // Check for actual Farcaster Mini App environment
    const isInFrame = window !== window.top;
    const hasValidFarcasterSDK = window.farcasterSDK && 
                                 window.farcasterSDK.wallet;
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    // Balanced detection for better mobile support
    const isDefinitelyFarcaster = 
      (isFarcasterUA && isFarcasterReferrer) ||  // Web Farcaster with referrer
      (isFarcasterUA && isInFrame) ||            // Embedded frame
      (isMobile && isFarcasterUA) ||             // Mobile Farcaster app
      (isFarcasterUA && hasValidFarcasterSDK) || // User agent + working SDK
      hasFarcasterParam;                         // Explicit frame parameter
    
    console.log('Farcaster detection:', {
      userAgent: userAgent,
      referrer: referrer,
      isFarcasterUA,
      isFarcasterReferrer,
      hasFarcasterParam,
      isInFrame,
      hasValidFarcasterSDK,
      isMobile,
      isDefinitelyFarcaster
    });
    
    return isDefinitelyFarcaster;
  }

  // Initialize Farcaster app with proper loading handling
  async initializeFarcasterApp() {
    console.log('Initializing Farcaster Mini App...');
    
    // Setup CORS error suppression for Farcaster analytics
    this.setupFarcasterErrorSuppression();
    
    // Try multiple approaches to call ready()
    let readyCalled = false;
    
    // Approach 1: Try immediate ready() call if SDK exists
    if (window.farcasterSDK && window.farcasterSDK.actions && window.farcasterSDK.actions.ready) {
      try {
        console.log('Calling immediate Farcaster SDK ready()...');
        await window.farcasterSDK.actions.ready();
        console.log('Immediate ready() call successful');
        readyCalled = true;
      } catch (error) {
        console.log('Immediate ready() failed:', error);
      }
    }
    
    // Approach 2: Wait for SDK and try again
    if (!readyCalled) {
      try {
        const sdk = await this.waitForFarcasterSDK(3000);
        
        if (sdk && sdk.actions && sdk.actions.ready) {
          console.log('Calling Farcaster SDK ready() after wait...');
          await sdk.actions.ready();
          console.log('Farcaster SDK ready() called successfully');
          readyCalled = true;
          
          // Store SDK reference globally
          window.farcasterSDK = sdk;
          
          // Dispatch custom event for components
          window.dispatchEvent(new CustomEvent('farcasterSdkReady', { detail: sdk }));
        }
      } catch (error) {
        console.log('SDK wait and ready() failed:', error);
      }
    }
    
    // Approach 3: Force ready event after timeout
    if (!readyCalled) {
      console.log('Force dispatching ready event as fallback...');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('farcasterSdkReady', { detail: null }));
      }, 1000);
    }
  }

  // Wait for Farcaster SDK to be available
  waitForFarcasterSDK(timeout = 5000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkSDK = () => {
        // Check for various SDK patterns
        const sdk = window.farcasterSDK || 
                   window.farcaster ||
                   window.fc || 
                   window.parent?.farcasterSDK || 
                   window.parent?.farcaster ||
                   window.parent?.fc;
        
        if (sdk) {
          console.log('Farcaster SDK found:', sdk);
          console.log('SDK type:', typeof sdk, 'Keys:', Object.keys(sdk));
          
          // If we found the raw injected SDK, wrap it
          if (sdk === window.farcaster && !window.farcasterSDK) {
            window.farcasterSDK = {
              actions: {
                ready: async () => {
                  console.log('SDK ready() wrapper called');
                  return true;
                }
              },
              wallet: sdk.wallet || sdk,
              context: sdk.context || sdk,
              raw: sdk
            };
          }
          
          resolve(window.farcasterSDK || sdk);
          return;
        }
        
        // Check if timeout exceeded
        if (Date.now() - startTime > timeout) {
          console.log('Farcaster SDK timeout reached');
          resolve(null);
          return;
        }
        
        // Continue checking
        setTimeout(checkSDK, 100);
      };
      
      checkSDK();
    });
  }

  // Setup error suppression for Farcaster analytics CORS errors
  setupFarcasterErrorSuppression() {
    if (window.farcasterErrorSuppressionSetup) return; // Already setup
    
    // Comprehensive fetch interception for Farcaster analytics
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      const analyticsPatterns = [
        'privy.farcaster.xyz',
        'warpcast.com/~/dd-proxy',
        'farcaster.xyz/~/dd-proxy',
        'csp-report.browser-intake-datadoghq.com',
        'datadog',
        'dd-proxy',
        'analytics'
      ];
      
      if (typeof url === 'string' && analyticsPatterns.some(pattern => url.includes(pattern))) {
        // Immediately return successful response for analytics
        return Promise.resolve(new Response('{}', { 
          status: 200, 
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      return originalFetch.apply(this, args).catch(error => {
        // Additional error suppression
        if (error.message?.includes('ERR_BLOCKED_BY_CLIENT') ||
            error.message?.includes('Bad Request') ||
            error.message?.includes('CORS')) {
          return Promise.resolve(new Response('{}', { status: 200 }));
        }
        throw error;
      });
    };
    
    window.farcasterErrorSuppressionSetup = true;
  }
}
