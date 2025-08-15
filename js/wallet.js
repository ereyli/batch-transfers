import { FarcasterManager } from './farcaster.js';
import { RPC_ENDPOINTS, NETWORK_NAMES, CONTRACTS } from './config.js';

export class WalletManager {
  constructor() {
    this.signer = null;
    this.currentWalletType = 'metamask';
    this.farcasterManager = new FarcasterManager();
    this.availableWallets = [];
  }

  // Initialize wallet manager
  async initialize() {
    await this.farcasterManager.initialize();
    this.farcasterManager.setupEventListeners();
    
    // Initialize wallet detection
    this.detectAvailableWallets();
    
    // Check if we're in Farcaster Mini App environment
    if (window.isFarcasterMiniApp && window.farcasterSDK) {
      console.log('Initializing Farcaster Mini App wallet integration...');
      await this.initializeFarcasterMiniAppWallet();
    }
    
    console.log('WalletManager initialized successfully');
  }

  // Initialize Farcaster Mini App wallet integration
  async initializeFarcasterMiniAppWallet() {
    try {
      console.log('Initializing Farcaster Mini App wallet...');
      
      // Check if we're in Farcaster Mini App environment
      if (window.isFarcasterMiniApp && window.farcasterSDK) {
        console.log('Farcaster Mini App detected - setting up wallet connection');
        
                // Get Farcaster wallet using SDK and Wagmi
        try {
          // Method 1: Try to get wallet directly from SDK
          let wallet = null;
          
          try {
            if (window.farcasterSDK.wallet && typeof window.farcasterSDK.wallet.getWallet === 'function') {
              wallet = await window.farcasterSDK.wallet.getWallet();
              console.log('Farcaster wallet from SDK:', wallet);
            } else {
              console.log('Farcaster SDK wallet.getWallet method not available');
            }
          } catch (error) {
            console.log('Could not get wallet from SDK:', error);
          }
          
          // Method 2: Try to get Ethereum provider
          if (!wallet && window.farcasterSDK.wallet && typeof window.farcasterSDK.wallet.getEthereumProvider === 'function') {
            try {
              const provider = await window.farcasterSDK.wallet.getEthereumProvider();
              if (provider) {
                const accounts = await provider.request({ method: 'eth_accounts' });
                if (accounts && accounts.length > 0) {
                  wallet = { address: accounts[0] };
                  console.log('Farcaster wallet from provider:', wallet);
                }
              }
            } catch (error) {
              console.log('Could not get provider:', error);
            }
          } else {
            console.log('Farcaster SDK wallet.getEthereumProvider method not available');
          }
          
          // Method 3: Try Wagmi if available
          if (!wallet && window.wagmiClient) {
            try {
              const { data: account } = await window.wagmiClient.getAccount();
              if (account && account.address) {
                wallet = account;
                console.log('Farcaster wallet from Wagmi:', wallet);
              }
            } catch (error) {
              console.log('Could not get account from Wagmi:', error);
            }
          }
          
          if (wallet && wallet.address) {
            console.log('User connected to Farcaster wallet:', wallet.address);
            
            // Create Farcaster wallet signer with proper provider
            let provider = null;
            
            // Try to get provider from Wagmi client
            if (window.wagmiClient && window.wagmiClient.getPublicClient) {
              try {
                const publicClient = window.wagmiClient.getPublicClient();
                if (publicClient) {
                  // Convert Wagmi public client to ethers provider
                  provider = new window.ethers.providers.Web3Provider(publicClient);
                }
              } catch (error) {
                console.log('Could not create provider from Wagmi client:', error);
              }
            }
            
            // Fallback: Create provider from Farcaster SDK
            if (!provider && window.farcasterSDK && window.farcasterSDK.wallet) {
              try {
                if (typeof window.farcasterSDK.wallet.getEthereumProvider === 'function') {
                  const ethProvider = await window.farcasterSDK.wallet.getEthereumProvider();
                  if (ethProvider) {
                    provider = new window.ethers.providers.Web3Provider(ethProvider);
                  }
                }
              } catch (error) {
                console.log('Could not create provider from Farcaster SDK:', error);
              }
            }
            
            // Final fallback: Create provider for Base network
            if (!provider) {
              try {
                const rpcUrl = 'https://mainnet.base.org';
                provider = new window.ethers.providers.JsonRpcProvider(rpcUrl);
                console.log('Created fallback provider for Base network');
              } catch (error) {
                console.error('Could not create fallback provider:', error);
              }
            }
            
            this.farcasterSigner = {
              address: wallet.address,
              provider: provider,
              getAddress: () => Promise.resolve(wallet.address),
              signMessage: async (message) => {
                try {
                  if (window.wagmiClient) {
                    const { data: signature } = await window.wagmiClient.signMessage({ message });
                    return signature;
                  } else {
                    throw new Error('No signing method available');
                  }
                } catch (error) {
                  console.error('Error signing message:', error);
                  throw error;
                }
              },
              signTransaction: async (transaction) => {
                try {
                  if (window.wagmiClient) {
                    const { data: signature } = await window.wagmiClient.signTransaction(transaction);
                    return signature;
                  } else {
                    throw new Error('No transaction signing method available');
                  }
                } catch (error) {
                  console.error('Error signing transaction:', error);
                  throw error;
                }
              },
              sendTransaction: async (transaction) => {
                try {
                  if (window.wagmiClient) {
                    const { data: hash } = await window.wagmiClient.sendTransaction(transaction);
                    return hash;
                  } else {
                    throw new Error('No transaction sending method available');
                  }
                } catch (error) {
                  console.error('Error sending transaction:', error);
                  throw error;
                }
              }
            };
            
            // Set as current signer
            this.signer = this.farcasterSigner;
            this.currentWalletType = 'farcaster';
            
            // Update UI to show connected state
            this.updateMainConnectButton(wallet.address, 'Farcaster Wallet', 'Farcaster', 'farcaster');
            
            // Set up event listeners
            this.setupFarcasterEventListeners();
            
            console.log('Farcaster wallet successfully initialized and connected');
            
            // Send notification
            try {
              await window.farcasterSDK.actions.sendNotification({
                title: 'Sendwise Connected!',
                body: 'Farcaster wallet connected successfully',
                url: window.location.href
              });
            } catch (error) {
              console.warn('Could not send notification:', error);
            }
            
            return wallet;
            
          } else {
            console.log('User not connected to Farcaster wallet');
            
            // Set up connection prompt
            this.setupFarcasterConnectionPrompt();
            
            return null;
          }
          
        } catch (error) {
          console.error('Error checking Farcaster wallet connection:', error);
          throw error;
        }
      } else {
        console.log('Not in Farcaster Mini App environment or SDK not available');
        return null;
      }
      
    } catch (error) {
      console.error('Error initializing Farcaster Mini App wallet:', error);
      throw error;
    }
  }

  // Setup Farcaster event listeners
  setupFarcasterEventListeners() {
    if (window.farcasterSDK && window.farcasterSDK.actions) {
      // Check if onWalletChange method exists
      if (typeof window.farcasterSDK.actions.onWalletChange === 'function') {
        window.farcasterSDK.actions.onWalletChange((wallet) => {
          console.log('Farcaster wallet changed:', wallet);
          if (wallet) {
            this.farcasterSigner.address = wallet.address;
            this.updateMainConnectButton(wallet.address, 'Farcaster Wallet', 'Farcaster', 'farcaster');
          }
        });
      } else {
        console.log('Farcaster SDK onWalletChange method not available');
      }
      
      // Check if onUserChange method exists
      if (typeof window.farcasterSDK.actions.onUserChange === 'function') {
        window.farcasterSDK.actions.onUserChange((user) => {
          console.log('Farcaster user changed:', user);
        });
      } else {
        console.log('Farcaster SDK onUserChange method not available');
      }
    }
    
    // Set up Wagmi event listeners if available
    if (window.wagmiClient) {
      // Listen for account changes
      window.wagmiClient.watchAccount((account) => {
        console.log('Wagmi account changed:', account);
        if (account.address) {
          this.updateMainConnectButton(account.address, 'Farcaster Wallet', 'Farcaster', 'farcaster');
        } else {
          this.updateMainConnectButton('', 'Connect Wallet', '', '');
        }
      });
      
      // Listen for chain changes
      window.wagmiClient.watchChainId((chainId) => {
        console.log('Wagmi chain changed:', chainId);
        // Update network display if needed
        const networkName = this.getChainName(chainId);
        this.updateMainConnectButton(this.signer?.address || '', 'Farcaster Wallet', networkName, 'farcaster');
      });
    }
  }

  // Switch to Farcaster wallet
  async switchToFarcasterWallet() {
    const account = await this.farcasterManager.switchToFarcasterWallet();
    if (account) {
      this.signer = account;
      this.currentWalletType = 'farcaster';
      this.updateWalletDisplay(account.address);
      return account;
    }
    return null;
  }

  // Setup Farcaster connection prompt
  setupFarcasterConnectionPrompt() {
    if (window.isFarcasterMiniApp) {
      // In Farcaster Mini App, show a connect button
      const connectButton = document.createElement('button');
      connectButton.textContent = 'Connect Farcaster Wallet';
      connectButton.className = 'btn btn-primary';
      connectButton.onclick = async () => {
        try {
          await this.connectFarcasterWallet();
        } catch (error) {
          console.error('Failed to connect Farcaster wallet:', error);
        }
      };
      
      // Add to UI
      const walletSelector = document.getElementById('walletSelector');
      if (walletSelector) {
        walletSelector.appendChild(connectButton);
      }
    }
  }

  // Connect to Farcaster wallet
  async connectFarcasterWallet() {
    try {
      if (!window.isFarcasterMiniApp || !window.farcasterSDK) {
        throw new Error('Farcaster Mini App environment not detected');
      }
      
      console.log('Connecting to Farcaster wallet...');
      
      // Method 1: Try to connect using SDK
      let wallet = null;
      
      try {
        if (window.farcasterSDK.wallet && window.farcasterSDK.wallet.connectWallet) {
          wallet = await window.farcasterSDK.wallet.connectWallet();
          console.log('Connected via SDK:', wallet);
        }
      } catch (error) {
        console.log('SDK connection failed:', error);
      }
      
      // Method 2: Try to connect using Ethereum provider
      if (!wallet && window.farcasterSDK.wallet && window.farcasterSDK.wallet.getEthereumProvider) {
        try {
          const provider = await window.farcasterSDK.wallet.getEthereumProvider();
          const accounts = await provider.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts.length > 0) {
            wallet = { address: accounts[0] };
            console.log('Connected via provider:', wallet);
          }
        } catch (error) {
          console.log('Provider connection failed:', error);
        }
      }
      
      // Method 3: Try Wagmi if available
      if (!wallet && window.wagmiClient) {
        try {
          const { data: account } = await window.wagmiClient.connect();
          if (account && account.address) {
            wallet = account;
            console.log('Connected via Wagmi:', wallet);
          }
        } catch (error) {
          console.log('Wagmi connection failed:', error);
        }
      }
      
      if (wallet && wallet.address) {
        console.log('Successfully connected to Farcaster wallet:', wallet.address);
        
        // Create Farcaster wallet signer
        this.farcasterSigner = {
          address: wallet.address,
          provider: window.wagmiClient ? window.wagmiClient.getPublicClient() : null,
          getAddress: () => Promise.resolve(wallet.address),
          signMessage: async (message) => {
            try {
              if (window.wagmiClient) {
                const { data: signature } = await window.wagmiClient.signMessage({ message });
                return signature;
              } else if (window.farcasterSDK.wallet && window.farcasterSDK.wallet.getEthereumProvider) {
                const provider = await window.farcasterSDK.wallet.getEthereumProvider();
                const accounts = await provider.request({ method: 'eth_accounts' });
                const signature = await provider.request({
                  method: 'personal_sign',
                  params: [message, accounts[0]]
                });
                return signature;
              } else {
                throw new Error('No signing method available');
              }
            } catch (error) {
              console.error('Error signing message:', error);
              throw error;
            }
          },
          signTransaction: async (transaction) => {
            try {
              if (window.wagmiClient) {
                const { data: signature } = await window.wagmiClient.signTransaction(transaction);
                return signature;
              } else if (window.farcasterSDK.wallet && window.farcasterSDK.wallet.getEthereumProvider) {
                const provider = await window.farcasterSDK.wallet.getEthereumProvider();
                const signature = await provider.request({
                  method: 'eth_signTransaction',
                  params: [transaction]
                });
                return signature;
              } else {
                throw new Error('No transaction signing method available');
              }
            } catch (error) {
              console.error('Error signing transaction:', error);
              throw error;
            }
          },
          sendTransaction: async (transaction) => {
            try {
              if (window.wagmiClient) {
                const { data: hash } = await window.wagmiClient.sendTransaction(transaction);
                return hash;
              } else if (window.farcasterSDK.wallet && window.farcasterSDK.wallet.getEthereumProvider) {
                const provider = await window.farcasterSDK.wallet.getEthereumProvider();
                const hash = await provider.request({
                  method: 'eth_sendTransaction',
                  params: [transaction]
                });
                return hash;
              } else {
                throw new Error('No transaction sending method available');
              }
            } catch (error) {
              console.error('Error sending transaction:', error);
              throw error;
            }
          }
        };
        
        // Set as current signer
        this.signer = this.farcasterSigner;
        this.currentWalletType = 'farcaster';
        
        // Update UI
        this.updateMainConnectButton(wallet.address, 'Farcaster Wallet', 'Farcaster', 'farcaster');
        
        // Set up event listeners
        this.setupFarcasterEventListeners();
        
        console.log('Farcaster wallet connected successfully');
        
        return wallet;
        
      } else {
        throw new Error('Failed to connect to Farcaster wallet');
      }
      
    } catch (error) {
      console.error('Error connecting to Farcaster wallet:', error);
      throw error;
    }
  }

  // Send Farcaster notification
  async sendFarcasterNotification(message) {
    try {
      if (window.farcasterSDK && window.isFarcasterMiniApp) {
        await window.farcasterSDK.actions.sendNotification({
          title: 'Sendwise',
          body: message,
          url: window.location.href
        });
        console.log('Farcaster notification sent:', message);
      }
    } catch (error) {
      console.error('Error sending Farcaster notification:', error);
    }
  }

  // Switch to MetaMask
  async switchToMetaMask() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask extension.');
      }

      // Show connecting state
      this.updateConnectButtonState('connecting');

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Request account access
      const accounts = await provider.send('eth_requestAccounts', []);
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }
      
      this.signer = provider.getSigner();
      this.currentWalletType = 'metamask';
      
      const addr = await this.signer.getAddress();
      
      // Get current network
      const network = await provider.getNetwork();
      
      // Check if current network is supported
      if (!this.isNetworkSupported(network.chainId)) {
        console.log('Current network not supported, switching to Base...');
        const switched = await this.switchToSupportedNetwork();
        if (!switched) {
          throw new Error('Please switch to a supported network (Base, Optimism, Arbitrum, Soneium, Unichain, or Ink)');
        }
        // Get updated network after switch
        const updatedNetwork = await provider.getNetwork();
        const chainName = this.getChainName(updatedNetwork.chainId);
        
        // Get balance using the correct RPC endpoint
        const rpcUrl = RPC_ENDPOINTS[updatedNetwork.chainId];
        if (rpcUrl) {
          const rpcProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
          const balance = await rpcProvider.getBalance(addr);
          const balanceEth = ethers.utils.formatEther(balance);
          
          // Update button
          this.updateMainConnectButton(addr, `${parseFloat(balanceEth).toFixed(4)} ETH`, chainName, 'metamask');
          
          console.log(`Connected to MetaMask on ${chainName}:`, addr);
          
          // Update UI status
          if (window.uiManager) {
            window.uiManager.updateStatus(`MetaMask connected successfully on ${chainName}`, true, false);
          }
          
          return this.signer;
        }
      }
      
      // If already on supported network, proceed normally
      const balance = await provider.getBalance(addr);
      const chainName = this.getChainName(network.chainId);
      const balanceEth = ethers.utils.formatEther(balance);
      
      // Update button
      this.updateMainConnectButton(addr, `${parseFloat(balanceEth).toFixed(4)} ETH`, chainName, 'metamask');
      
      console.log('Connected to MetaMask:', addr);
      
      // Update UI status
      if (window.uiManager) {
        window.uiManager.updateStatus('MetaMask connected successfully', true, false);
      }
      
      return this.signer;
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      
      // Reset button state on error
      this.updateConnectButtonState('disconnected');
      
      // Update UI status
      if (window.uiManager) {
        window.uiManager.updateStatus('Failed to connect to MetaMask: ' + error.message, false, true);
      }
      
      throw new Error('Failed to connect to MetaMask: ' + error.message);
    }
  }

  // Show Modern Wallet Modal
  showModernWalletModal() {
    try {
      // If in Farcaster Mini App, don't show modal, auto-connect instead
      if (window.isFarcasterMiniApp) {
        console.log('In Farcaster Mini App - wallet modal not needed, auto-connecting');
        // Don't show modal in Farcaster Mini App, just try to auto-connect
        this.initializeFarcasterMiniAppWallet().catch(error => {
          console.error('Auto-connection failed:', error);
          // Show error message but don't show modal
          if (window.uiManager) {
            window.uiManager.updateStatus('Failed to connect to Farcaster wallet', false, true);
          }
        });
        return;
      }
      // In web, simplify to directly try Farcaster first or show minimal modal with only Farcaster
      const availableWallets = this.detectAvailableWallets();
      if (!availableWallets.includes('farcaster')) {
        // Show minimal info without alert in sandbox
        if (window.uiManager) {
          window.uiManager.updateStatus('Open this app inside Farcaster to connect with the Farcaster wallet.', false, true);
        }
        return;
      }
      // If Farcaster is available, attempt connection
      this.connectFarcasterWallet().catch((err) => {
        console.error('Farcaster connection failed:', err);
        if (window.uiManager) {
          window.uiManager.updateStatus('Failed to connect to Farcaster wallet', false, true);
        }
      });

    } catch (error) {
      console.error('Error showing modern wallet modal:', error);
    }
  }

  // Close modal helper
  closeModal(modal) {
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  }

  // Switch to Coinbase Wallet
  async switchToCoinbase() {
    try {
      // Show connecting state
      this.updateConnectButtonState('connecting');

      if (!window.coinbaseWalletExtension) {
        throw new Error('Coinbase Wallet not installed. Please install Coinbase Wallet extension.');
      }

      const provider = new ethers.providers.Web3Provider(window.coinbaseWalletExtension);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts && accounts.length > 0) {
        this.signer = provider.getSigner();
        this.currentWalletType = 'coinbase';
        
        const addr = await this.signer.getAddress();
        
        // Get balance and chain info
        const balance = await provider.getBalance(addr);
        const network = await provider.getNetwork();
        const chainName = this.getChainName(network.chainId);
        const balanceEth = ethers.utils.formatEther(balance);
        
        // Update button
        this.updateMainConnectButton(addr, `${parseFloat(balanceEth).toFixed(4)} ETH`, chainName, 'coinbase');
        
        console.log('Connected to Coinbase Wallet:', addr);
        return this.signer;
      } else {
        throw new Error('No accounts found in Coinbase Wallet');
      }
    } catch (error) {
      console.error('Error connecting to Coinbase Wallet:', error);
      // Reset button state on error
      this.updateConnectButtonState('disconnected');
      throw new Error('Failed to connect to Coinbase Wallet: ' + error.message);
    }
  }

  // Detect available wallets
  detectAvailableWallets() {
    const wallets = [];
    // In Farcaster Mini App, ONLY allow Farcaster wallet
    if (window.isFarcasterMiniApp) {
      wallets.push('farcaster');
      return wallets;
    }
    // On web, still allow all (unchanged)
    if (window.ethereum?.isMetaMask) wallets.push('metamask');
    if (window.ethereum?.isCoinbaseWallet) wallets.push('coinbase');
    if (wallets.length === 0 && window.ethereum) wallets.push('metamask');
    if (window.coinbaseWalletExtension && !wallets.includes('coinbase')) wallets.push('coinbase');
    return wallets;
  }

  // Update Connect Button State
  updateConnectButtonState(state) {
    const button = document.getElementById('headerWalletBtn');
    if (!button) return;

    switch (state) {
      case 'disconnected':
        button.innerHTML = `
          <span style="font-size: 16px;">💳</span>
          <span>Connect Wallet</span>
        `;
        button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        button.style.cursor = 'pointer';
        break;
        
      case 'connecting':
        button.innerHTML = `
          <div style="width: 16px; height: 16px; border: 2px solid transparent; border-top: 2px solid currentColor; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <span>Connecting...</span>
        `;
        button.style.cursor = 'not-allowed';
        break;
    }
  }

  // Get chain name
  getChainName(chainId) {
    return NETWORK_NAMES[chainId] || 'Unknown';
  }

  // Check if network is supported
  isNetworkSupported(chainId) {
    return CONTRACTS.hasOwnProperty(chainId);
  }

  // Get supported networks
  getSupportedNetworks() {
    return Object.keys(CONTRACTS).map(Number);
  }

  // Switch to supported network
  async switchToSupportedNetwork() {
    const signer = this.getSigner();
    if (!signer) return false;

    try {
      const provider = signer.provider;
      const currentNetwork = await provider.getNetwork();
      
      // If already on supported network, return true
      if (this.isNetworkSupported(currentNetwork.chainId)) {
        return true;
      }

      // Try to switch to first supported network (Base)
      const supportedChainId = 8453; // Base network
      
      try {
        await provider.send('wallet_switchEthereumChain', [
          { chainId: `0x${supportedChainId.toString(16)}` }
        ]);
        return true;
      } catch (switchError) {
        // If network not added, add it
        if (switchError.code === 4902) {
          const networkConfig = this.getNetworkConfig(supportedChainId);
          if (networkConfig) {
            await provider.send('wallet_addEthereumChain', [networkConfig]);
            return true;
          }
        }
        throw switchError;
      }
    } catch (error) {
      console.error('Error switching network:', error);
      return false;
    }
  }

  // Get network configuration for wallet_addEthereumChain
  getNetworkConfig(chainId) {
    const networkConfigs = {
      8453: { // Base
        chainId: '0x2105',
        chainName: 'Base',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['https://mainnet.base.org'],
        blockExplorerUrls: ['https://basescan.org']
      },
      10: { // Optimism
        chainId: '0xa',
        chainName: 'Optimism',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['https://mainnet.optimism.io'],
        blockExplorerUrls: ['https://optimistic.etherscan.io']
      },
      42161: { // Arbitrum
        chainId: '0xa4b1',
        chainName: 'Arbitrum One',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['https://arb1.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://arbiscan.io']
      }
    };
    
    return networkConfigs[chainId];
  }

  // Disconnect wallet
  async disconnectWallet() {
    try {
      this.signer = null;
      this.currentWalletType = null;
      
      // Reset button
      this.updateConnectButtonState('disconnected');
      
      console.log('Wallet disconnected');
      
      // Update UI status
      if (window.uiManager) {
        window.uiManager.updateStatus('Wallet disconnected', false, false);
      }
      
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }

  // Update main connect button
  updateMainConnectButton(address, balance, chainName, walletType) {
    const mainBtn = document.getElementById('headerWalletBtn');
    if (!mainBtn) return;

    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
    const walletIcon = this.getWalletIcon(walletType);
    
    mainBtn.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
        <span style="font-size: 18px;">${walletIcon}</span>
        <div style="text-align: left;">
          <div style="font-weight: 600;">${shortAddress}</div>
          <div style="font-size: 12px; opacity: 0.8;">${balance} • ${chainName}</div>
        </div>
      </div>
    `;
    
    mainBtn.style.background = 'rgba(255, 255, 255, 0.1)';
    mainBtn.style.border = '2px solid rgba(255, 255, 255, 0.2)';
    mainBtn.onclick = () => this.disconnectWallet();
    
    // Show send button when wallet is connected
    if (address && window.uiManager) {
      window.uiManager.toggleSendButton(true);
      console.log('Send button should now be visible');
    }
  }

  // Get wallet icon
  getWalletIcon(walletType) {
    switch (walletType) {
      case 'farcaster': return '🔗';
      case 'metamask': return '🦊';
      case 'coinbase': return '🪙';
      default: return '💳';
    }
  }

  // Get current signer
  getSigner() {
    return this.signer;
  }

  // Get current wallet type
  getCurrentWalletType() {
    return this.currentWalletType;
  }

  // Get network information
  getNetworkInfo() {
    try {
      // If Farcaster wallet: prefer user-selected chain if available
      if (this.currentWalletType === 'farcaster') {
        const selected = window.selectedChainId ? Number(window.selectedChainId) : 8453;
        return { chainId: selected, name: this.getChainName(selected) };
      }

      if (!this.signer || !this.signer.provider) {
        return null;
      }

      // For other wallets, get from provider
      const provider = this.signer.provider;
      if (provider && provider.network) {
        return {
          chainId: provider.network.chainId,
          name: this.getChainName(provider.network.chainId)
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }

  // Check if wallet is connected
  isConnected() {
    return this.signer !== null;
  }

  // Get wallet address
  async getAddress() {
    if (!this.signer) return null;
    
    try {
      if (this.currentWalletType === 'farcaster') {
        return this.signer.address;
      } else {
        return await this.signer.getAddress();
      }
    } catch (error) {
      console.error('Error getting address:', error);
      return null;
    }
  }

  // Get provider
  getProvider() {
    if (!this.signer) return null;
    
    if (this.currentWalletType === 'farcaster') {
      return this.signer.provider;
    } else {
      return this.signer.provider;
    }
  }

  // Get Farcaster manager
  getFarcasterManager() {
    return this.farcasterManager;
  }

  // Update wallet display (compatibility)
  updateWalletDisplay(address) {
    // This function is kept for compatibility
  }
}
