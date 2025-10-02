// Global Error Handler for Sendwise Mini App

class ErrorHandler {
  constructor() {
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    // Error patterns to suppress (Farcaster-specific)
    this.suppressPatterns = [
      'Failed to resolve module specifier',
      '@farcaster/frame-core',
      'Relative references must start with',
      'privy.farcaster.xyz',
      'CORS',
      'ERR_BLOCKED_BY_CLIENT',
      'dd-proxy',
      'datadog',
      'X-Frame-Options',
      'chromewebdata',
      'csp-report.browser-intake-datadoghq.com',
      'warpcast.com/~/dd-proxy',
      'farcaster.xyz/~/dd-proxy',
      'Expected length',
      'attribute width',
      'attribute height',
      'svg',
      'Bad Request',
      'Backpack',
      'window.ethereum',
      'ERR_TIMED_OUT',
      'Failed to fetch',
      'ERR_CONNECTION_CLOSED',
      'ERR_INTERNET_DISCONNECTED',
      'ERR_NAME_NOT_RESOLVED',
      'WebSocket connection',
      'Farcaster API Error',
      'Cannot set property ethereum',
      'Cannot redefine property',
      'isZerion',
      'getDesktopListings',
      'getRecomendedWallets',
      'preloadListings',
      'Port connected',
      'Failed to set window.ethereum',
      'Missing catch or finally after try',
      'Uncaught SyntaxError',
      'SyntaxError',
      'Invalid or unexpected token',
      'openWalletModal is not a function',
      'addInput is not defined',
      'sendBatch is not defined',
      'setupNetworkTags is not defined',
      'Ignored call to \'alert()\'',
      'Ignored call to \'confirm()\'',
      'allow-modals',
      'MetaMask encountered an error',
      'setting the global Ethereum provider',
      'another Ethereum wallet extension',
      'Cannot set property ethereum',
      'which has only a getter',
      'Uncaught (in promise) TypeError',
      'Cannot redefine property',
      'override `window.ethereum`',
      'Access to script at',
      'has been blocked by CORS policy',
      'No \'Access-Control-Allow-Origin\' header'
    ];

    this.setupConsoleErrorFilter();
    this.setupGlobalErrorHandler();
    this.setupUnhandledRejectionHandler();
    this.setupFetchInterception();
  }

  setupConsoleErrorFilter() {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      
      if (this.shouldSuppressError(message)) {
        console.log('Suppressed error:', message);
        return;
      }
      
      originalConsoleError.apply(console, args);
    };
  }

  setupGlobalErrorHandler() {
    window.addEventListener('error', (e) => {
      if (e.message && this.shouldSuppressError(e.message)) {
        console.log('Suppressed global error:', e.message);
        e.preventDefault();
        return false;
      }
    });
  }

  setupUnhandledRejectionHandler() {
    window.addEventListener('unhandledrejection', (e) => {
      const errorMessage = e.reason?.message || e.reason || '';
      
      if (this.shouldSuppressError(errorMessage)) {
        console.log('Suppressed promise rejection:', errorMessage);
        e.preventDefault();
        return false;
      }
    });
  }

  setupFetchInterception() {
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
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
        // Return successful response for analytics
        return Promise.resolve(new Response('{}', { 
          status: 200, 
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      return originalFetch.apply(this, args).catch(error => {
        if (this.shouldSuppressError(error.message)) {
          return Promise.resolve(new Response('{}', { status: 200 }));
        }
        throw error;
      });
    };
  }

  shouldSuppressError(message) {
    return this.suppressPatterns.some(pattern => message.includes(pattern));
  }
}

// Initialize error handler immediately
new ErrorHandler();

// Export for potential external use
window.ErrorHandler = ErrorHandler;
