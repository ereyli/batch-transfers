import { FarcasterManager } from './farcaster.js';

export class WalletManager {
  constructor() {
    this.signer = null;
    this.currentWalletType = 'metamask';
    this.farcasterManager = new FarcasterManager();
    this.rainbowConnector = null;
    this.availableWallets = [];
    this.rainbowKit = null;
  }

  // Initialize wallet manager
  async initialize() {
    await this.farcasterManager.initialize();
    this.farcasterManager.setupEventListeners();
    
    // Initialize Rainbow Wallet connector
    await this.initializeRainbowConnector();
  }

  // Switch to Farcaster wallet
  async switchToFarcasterWallet() {
    const account = await this.farcasterManager.switchToFarcasterWallet();
    if (account) {
      this.signer = account;
      this.currentWalletType = 'farcaster';
      this.updateWalletButtons();
      this.updateWalletDisplay(account.address);
      return account;
    }
    return null;
  }

  // Switch to MetaMask
  async switchToMetaMask() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask extension.');
      }

      // Show connecting state
      const connectBtn = document.getElementById('rainbowkitConnectBtn');
      if (connectBtn) {
        this.updateConnectButtonState(connectBtn, 'connecting');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Request account access
      const accounts = await provider.send('eth_requestAccounts', []);
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }
      
      this.signer = provider.getSigner();
      this.currentWalletType = 'metamask';
      this.updateWalletButtons();
      
      const addr = await this.signer.getAddress();
      
      // Get balance and chain info
      const balance = await provider.getBalance(addr);
      const network = await provider.getNetwork();
      const chainName = this.getChainName(network.chainId);
      const balanceEth = ethers.utils.formatEther(balance);
      
              // Update both buttons
        this.updateWalletDisplay(addr);
        this.updateMainConnectButton(addr, `${parseFloat(balanceEth).toFixed(4)} ETH`, chainName, 'metamask');
        if (connectBtn) {
          this.updateConnectButtonState(connectBtn, 'connected', {
            address: addr,
            balance: `${parseFloat(balanceEth).toFixed(4)} ETH`,
            chainName: chainName,
            walletType: 'metamask'
          });
        }
      
              console.log('Connected to MetaMask:', addr);
        
        // Update UI status
        if (window.uiManager) {
          window.uiManager.updateStatus('MetaMask connected successfully', true, false);
        }
        
        return this.signer;
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
        // Reset button state on error
        const connectBtn = document.getElementById('rainbowkitConnectBtn');
        if (connectBtn) {
          this.updateConnectButtonState(connectBtn, 'disconnected');
        }
        
        // Update UI status
        if (window.uiManager) {
          window.uiManager.updateStatus('Failed to connect to MetaMask: ' + error.message, false, true);
        }
        
        throw new Error('Failed to connect to MetaMask: ' + error.message);
      }
  }

  // Initialize Rainbow Wallet connector
  async initializeRainbowConnector() {
    try {
      console.log('Initializing Rainbow Wallet connector...');
      
      // Check for available wallets
      const availableWallets = this.detectAvailableWallets();
      console.log('Available wallets:', availableWallets);
      
      // Create modern wallet connect button
      console.log('Calling createModernWalletConnectButton...');
      this.createModernWalletConnectButton();
      console.log('createModernWalletConnectButton called successfully');
      
    } catch (error) {
      console.log('Wallet initialization error:', error.message);
    }
  }

  // Create Modern Wallet Connect Button (RainbowKit Style)
  createModernWalletConnectButton() {
    try {
      console.log('Setting up modern wallet connect button...');
      
      // Get the existing button from HTML
      const connectButton = document.getElementById('rainbowkitConnectBtn');
      console.log('Connect button:', connectButton);
      
      if (!connectButton) {
        console.error('Connect button not found!');
        return;
      }

      // Add click handler to the existing button
      connectButton.addEventListener('click', () => {
        if (this.isConnected()) {
          this.disconnectWallet();
        } else {
          this.showModernWalletModal();
        }
      });
      
      console.log('Modern wallet connect button setup successfully!');

    } catch (error) {
      console.error('Error setting up modern wallet connect button:', error);
    }
  }

  // Update Connect Button State (RainbowKit Style)
  updateConnectButtonState(button, state, data = {}) {
    if (!button) return;

    const isSmallScreen = window.innerWidth < 768;
    
    switch (state) {
      case 'disconnected':
        button.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;"></span>
            <span>Connect Wallet</span>
          </div>
        `;
        button.style.cssText = `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          margin-top: 10px;
          font-family: 'Inter', sans-serif;
          min-width: 140px;
        `;
        break;
        
      case 'connected':
        const { address, balance, chainName, walletType } = data;
        const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
        const walletIcon = this.getWalletIcon(walletType);
        
        if (isSmallScreen) {
          // Small screen: Show only avatar/icon
          button.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">${walletIcon}</span>
            </div>
          `;
        } else {
          // Large screen: Show full info
          button.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">${walletIcon}</span>
              <div style="text-align: left; line-height: 1.2;">
                <div style="font-size: 14px; font-weight: 600;">${shortAddress}</div>
                ${balance ? `<div style="font-size: 12px; opacity: 0.8;">${balance}</div>` : ''}
              </div>
              <span style="font-size: 12px; opacity: 0.7;">${chainName || 'ETH'}</span>
            </div>
          `;
        }
        
        button.style.cssText = `
          background: white;
          color: #1a1a1a;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-top: 10px;
          font-family: 'Inter', sans-serif;
          min-width: 140px;
        `;
        break;
        
      case 'connecting':
        button.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 16px; height: 16px; border: 2px solid transparent; border-top: 2px solid currentColor; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span>Connecting...</span>
          </div>
        `;
        button.style.cssText = `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 600;
          cursor: not-allowed;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          margin-top: 10px;
          font-family: 'Inter', sans-serif;
          min-width: 140px;
          opacity: 0.8;
        `;
        break;
    }

    // Add hover effects for connected state
    if (state === 'connected') {
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        button.style.borderColor = '#667eea';
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        button.style.borderColor = '#e0e0e0';
      });
    } else {
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
      });
    }

    // Add CSS animation for loading spinner
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // Get wallet icon
  getWalletIcon(walletType) {
    switch (walletType) {
      case 'farcaster': return '🔗';
      case 'metamask': return '🦊';
      case 'rainbow': return '🌈';
      case 'coinbase': return '🪙';
      case 'trustwallet': return '🛡️';
      default: return '💳';
    }
  }

  // Get chain name
  getChainName(chainId) {
    switch (chainId) {
      case 1: return 'ETH';
      case 8453: return 'Base';
      case 10: return 'Optimism';
      case 42161: return 'Arbitrum';
      case 137: return 'Polygon';
      case 56: return 'BSC';
      default: return 'Unknown';
    }
  }

  // Disconnect wallet
  async disconnectWallet() {
    try {
      this.signer = null;
      this.currentWalletType = null;
      
      // Reset main button
      const mainBtn = document.getElementById('headerWalletBtn');
      if (mainBtn) {
        mainBtn.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; gap: 12px; position: relative; z-index: 2;">
            <span style="font-size: 20px;"></span>
            <span>Connect Wallet</span>
          </div>
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%); opacity: 0; transition: opacity 0.3s ease; z-index: 1;" class="button-overlay"></div>
        `;
        mainBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        mainBtn.style.border = 'none';
        mainBtn.onclick = () => window.openWalletModal();
      }
      
      console.log('Wallet disconnected');
      
      // Update UI status
      if (window.uiManager) {
        window.uiManager.updateStatus('Wallet disconnected', false, false);
      }
      
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }

  // Show Modern Wallet Modal
  showModernWalletModal() {
    try {
      // Create modern modal with wallet selection
      const modal = document.createElement('div');
      modal.className = 'modern-wallet-modal-overlay';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(8px);
      `;

      const modalContent = document.createElement('div');
      modalContent.className = 'modern-wallet-modal-content';
      modalContent.style.cssText = `
        background: white;
        border-radius: 20px;
        padding: 32px;
        max-width: 480px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: modalSlideIn 0.3s ease-out;
        font-family: 'Inter', sans-serif;
      `;

      modalContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 32px;">
          <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1a1a1a;">Connect Wallet</h2>
          <p style="margin: 0; color: #666; font-size: 16px;">Choose your preferred wallet</p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button class="wallet-option" data-wallet="metamask" style="
            display: flex; align-items: center; gap: 12px; padding: 16px; border: 2px solid #f0f0f0; 
            border-radius: 12px; background: white; cursor: pointer; transition: all 0.2s ease;
            font-size: 16px; font-weight: 600; color: #1a1a1a; text-align: left; width: 100%;
            font-family: 'Inter', sans-serif;
          ">
            <span style="font-size: 24px;">🦊</span>
            <div>
              <div>MetaMask</div>
              <div style="font-size: 14px; font-weight: 400; color: #666; margin-top: 2px;">Connect with MetaMask</div>
            </div>
          </button>
          
          <button class="wallet-option" data-wallet="rainbow" style="
            display: flex; align-items: center; gap: 12px; padding: 16px; border: 2px solid #f0f0f0; 
            border-radius: 12px; background: white; cursor: pointer; transition: all 0.2s ease;
            font-size: 16px; font-weight: 600; color: #1a1a1a; text-align: left; width: 100%;
            font-family: 'Inter', sans-serif;
          ">
            <span style="font-size: 24px;">🌈</span>
            <div>
              <div>Rainbow</div>
              <div style="font-size: 14px; font-weight: 400; color: #666; margin-top: 2px;">Connect with Rainbow Wallet</div>
            </div>
          </button>
          
          <button class="wallet-option" data-wallet="coinbase" style="
            display: flex; align-items: center; gap: 12px; padding: 16px; border: 2px solid #f0f0f0; 
            border-radius: 12px; background: white; cursor: pointer; transition: all 0.2s ease;
            font-size: 16px; font-weight: 600; color: #1a1a1a; text-align: left; width: 100%;
            font-family: 'Inter', sans-serif;
          ">
            <span style="font-size: 24px;">🪙</span>
            <div>
              <div>Coinbase Wallet</div>
              <div style="font-size: 14px; font-weight: 400; color: #666; margin-top: 2px;">Connect with Coinbase</div>
            </div>
          </button>
          
          <button class="wallet-option" data-wallet="trustwallet" style="
            display: flex; align-items: center; gap: 12px; padding: 16px; border: 2px solid #f0f0f0; 
            border-radius: 12px; background: white; cursor: pointer; transition: all 0.2s ease;
            font-size: 16px; font-weight: 600; color: #1a1a1a; text-align: left; width: 100%;
            font-family: 'Inter', sans-serif;
          ">
            <span style="font-size: 24px;">🛡️</span>
            <div>
              <div>Trust Wallet</div>
              <div style="font-size: 14px; font-weight: 400; color: #666; margin-top: 2px;">Connect with Trust Wallet</div>
            </div>
          </button>
        </div>
        
        <button class="close-modal" style="
          margin-top: 24px; width: 100%; padding: 12px; border: none; border-radius: 12px; 
          background: #f0f0f0; color: #666; font-size: 16px; font-weight: 600; cursor: pointer;
          transition: background 0.2s ease; font-family: 'Inter', sans-serif;
        ">Cancel</button>
      `;

      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      // Add CSS animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .wallet-option:hover {
          border-color: #667eea !important;
          background: #f8f9ff !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }
        
        .close-modal:hover {
          background: #e0e0e0 !important;
        }
      `;
      document.head.appendChild(style);

      // Add event listeners
      const walletOptions = modalContent.querySelectorAll('.wallet-option');
      walletOptions.forEach(option => {
        option.addEventListener('click', async () => {
          const walletType = option.dataset.wallet;
          try {
            switch (walletType) {
              case 'metamask':
                await this.switchToMetaMask();
                break;
              case 'rainbow':
                await this.switchToRainbow();
                break;
              case 'coinbase':
                await this.switchToCoinbase();
                break;
              case 'trustwallet':
                await this.switchToTrustWallet();
                break;
            }
            this.closeModal(modal);
          } catch (error) {
            console.error(`Error connecting to ${walletType}:`, error);
            alert(`Failed to connect to ${walletType}: ${error.message}`);
          }
        });
      });

      const closeButton = modalContent.querySelector('.close-modal');
      closeButton.addEventListener('click', () => {
        this.closeModal(modal);
      });

      // Close modal when clicking outside
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal);
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



  // Switch to Rainbow Wallet
  async switchToRainbow() {
    try {
      // Show connecting state
      const connectBtn = document.getElementById('rainbowkitConnectBtn');
      if (connectBtn) {
        this.updateConnectButtonState(connectBtn, 'connecting');
      }

      // Direct Rainbow Wallet connection
      if (!window.rainbow) {
        throw new Error('Rainbow Wallet not installed. Please install Rainbow Wallet extension.');
      }

      const result = await window.rainbow.connect();
      
      if (result && result.provider) {
        const provider = new ethers.providers.Web3Provider(result.provider);
        this.signer = provider.getSigner();
        this.currentWalletType = 'rainbow';
        this.updateWalletButtons();
        
        const addr = await this.signer.getAddress();
        
        // Get balance and chain info
        const balance = await provider.getBalance(addr);
        const network = await provider.getNetwork();
        const chainName = this.getChainName(network.chainId);
        const balanceEth = ethers.utils.formatEther(balance);
        
        // Update both buttons
        this.updateWalletDisplay(addr);
        this.updateMainConnectButton(addr, `${parseFloat(balanceEth).toFixed(4)} ETH`, chainName, 'rainbow');
        if (connectBtn) {
          this.updateConnectButtonState(connectBtn, 'connected', {
            address: addr,
            balance: `${parseFloat(balanceEth).toFixed(4)} ETH`,
            chainName: chainName,
            walletType: 'rainbow'
          });
        }
        
        console.log('Connected to Rainbow Wallet:', addr);
        return this.signer;
      } else {
        throw new Error('Failed to connect to Rainbow Wallet');
      }
    } catch (error) {
      console.error('Error connecting to Rainbow Wallet:', error);
      // Reset button state on error
      const connectBtn = document.getElementById('rainbowkitConnectBtn');
      if (connectBtn) {
        this.updateConnectButtonState(connectBtn, 'disconnected');
      }
      throw new Error('Failed to connect to Rainbow Wallet: ' + error.message);
    }
  }

  // Switch to Coinbase Wallet
  async switchToCoinbase() {
    try {
      // Show connecting state
      const connectBtn = document.getElementById('rainbowkitConnectBtn');
      if (connectBtn) {
        this.updateConnectButtonState(connectBtn, 'connecting');
      }

      if (!window.coinbaseWalletExtension) {
        throw new Error('Coinbase Wallet not installed. Please install Coinbase Wallet extension.');
      }

      const provider = new ethers.providers.Web3Provider(window.coinbaseWalletExtension);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts && accounts.length > 0) {
        this.signer = provider.getSigner();
        this.currentWalletType = 'coinbase';
        this.updateWalletButtons();
        
        const addr = await this.signer.getAddress();
        
        // Get balance and chain info
        const balance = await provider.getBalance(addr);
        const network = await provider.getNetwork();
        const chainName = this.getChainName(network.chainId);
        const balanceEth = ethers.utils.formatEther(balance);
        
        // Update both buttons
        this.updateWalletDisplay(addr);
        this.updateMainConnectButton(addr, `${parseFloat(balanceEth).toFixed(4)} ETH`, chainName, 'coinbase');
        if (connectBtn) {
          this.updateConnectButtonState(connectBtn, 'connected', {
            address: addr,
            balance: `${parseFloat(balanceEth).toFixed(4)} ETH`,
            chainName: chainName,
            walletType: 'coinbase'
          });
        }
        
        console.log('Connected to Coinbase Wallet:', addr);
        return this.signer;
      } else {
        throw new Error('No accounts found in Coinbase Wallet');
      }
    } catch (error) {
      console.error('Error connecting to Coinbase Wallet:', error);
      // Reset button state on error
      const connectBtn = document.getElementById('rainbowkitConnectBtn');
      if (connectBtn) {
        this.updateConnectButtonState(connectBtn, 'disconnected');
      }
      throw new Error('Failed to connect to Coinbase Wallet: ' + error.message);
    }
  }

  // Switch to Trust Wallet
  async switchToTrustWallet() {
    try {
      // Show connecting state
      const connectBtn = document.getElementById('rainbowkitConnectBtn');
      if (connectBtn) {
        this.updateConnectButtonState(connectBtn, 'connecting');
      }

      if (!window.trustwallet) {
        throw new Error('Trust Wallet not installed. Please install Trust Wallet extension.');
      }

      const provider = new ethers.providers.Web3Provider(window.trustwallet);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts && accounts.length > 0) {
        this.signer = provider.getSigner();
        this.currentWalletType = 'trustwallet';
        this.updateWalletButtons();
        
        const addr = await this.signer.getAddress();
        
        // Get balance and chain info
        const balance = await provider.getBalance(addr);
        const network = await provider.getNetwork();
        const chainName = this.getChainName(network.chainId);
        const balanceEth = ethers.utils.formatEther(balance);
        
        // Update both buttons
        this.updateWalletDisplay(addr);
        this.updateMainConnectButton(addr, `${parseFloat(balanceEth).toFixed(4)} ETH`, chainName, 'trustwallet');
        if (connectBtn) {
          this.updateConnectButtonState(connectBtn, 'connected', {
            address: addr,
            balance: `${parseFloat(balanceEth).toFixed(4)} ETH`,
            chainName: chainName,
            walletType: 'trustwallet'
          });
        }
        
        console.log('Connected to Trust Wallet:', addr);
        return this.signer;
      } else {
        throw new Error('No accounts found in Trust Wallet');
      }
    } catch (error) {
      console.error('Error connecting to Trust Wallet:', error);
      // Reset button state on error
      const connectBtn = document.getElementById('rainbowkitConnectBtn');
      if (connectBtn) {
        this.updateConnectButtonState(connectBtn, 'disconnected');
      }
      throw new Error('Failed to connect to Trust Wallet: ' + error.message);
    }
  }





  // Detect available wallets
  detectAvailableWallets() {
    const wallets = [];
    
    if (window.ethereum) {
      wallets.push('metamask');
    }
    
    if (window.rainbow) {
      wallets.push('rainbow');
    }
    
    if (window.coinbaseWalletExtension) {
      wallets.push('coinbase');
    }
    
    if (window.trustwallet) {
      wallets.push('trustwallet');
    }
    
    return wallets;
  }

  // Update wallet selector buttons (no longer needed since we removed individual buttons)
  updateWalletButtons() {
    // This function is kept for compatibility but no longer needed
    // since we removed individual wallet buttons
  }

  // Update wallet display (now handled by RainbowKit style button)
  updateWalletDisplay(address) {
    // This function is now handled by the modern RainbowKit style button
    // The button automatically updates its state when connected
  }

  // Get wallet display name
  getWalletDisplayName() {
    switch (this.currentWalletType) {
      case 'farcaster':
        return '🔗 Farcaster';
      case 'metamask':
        return '🦊 MetaMask';
      case 'rainbow':
        return '🌈 Rainbow';
      case 'coinbase':
        return '🪙 Coinbase';
      case 'trustwallet':
        return '🛡️ Trust';
      default:
        return 'Wallet';
    }
  }

  // Check if wallet is connected
  isConnected() {
    return this.signer !== null;
  }

  // Update main connect button
  updateMainConnectButton(address, balance, chainName, walletType) {
    const mainBtn = document.getElementById('headerWalletBtn');
    if (!mainBtn) return;

    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
    const walletIcon = this.getWalletIcon(walletType);
    
    mainBtn.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 12px; position: relative; z-index: 2;">
        <span style="font-size: 18px;">${walletIcon}</span>
        <div style="text-align: left;">
          <div style="font-weight: 600;">${shortAddress}</div>
          <div style="font-size: 12px; opacity: 0.8;">${balance} • ${chainName}</div>
        </div>
      </div>
      <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%); opacity: 0; transition: opacity 0.3s ease; z-index: 1;" class="button-overlay"></div>
    `;
    
    mainBtn.style.background = 'rgba(255, 255, 255, 0.1)';
    mainBtn.style.border = '2px solid rgba(255, 255, 255, 0.2)';
    mainBtn.onclick = () => this.disconnectWallet();
  }

  // Get current signer
  getSigner() {
    return this.signer;
  }

  // Get current wallet type
  getCurrentWalletType() {
    return this.currentWalletType;
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
}
