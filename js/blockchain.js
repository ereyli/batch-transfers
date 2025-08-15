import { CONTRACTS, CONTRACTS_ERC20, ABI_TOKEN, ABI_APPROVE, ABI_BATCH_ETH, ABI_BATCH_ERC20, APP_CONFIG, RPC_ENDPOINTS } from './config.js';

export class BlockchainManager {
  constructor(walletManager, uiManager) {
    this.walletManager = walletManager;
    this.uiManager = uiManager;
  }

  // Fetch token information
  async fetchTokenInfo() {
    const tokenAddress = this.uiManager.getTokenAddress();
    if (!ethers.utils.isAddress(tokenAddress)) return;
    
    const signer = this.walletManager.getSigner();
    if (!signer) {
      this.uiManager.updateStatus('Please connect wallet first', false, true);
      return;
    }

    try {
      const provider = signer.provider || new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      const spender = CONTRACTS_ERC20[network.chainId];
      
      // Use the correct RPC endpoint for the current network
      const rpcUrl = RPC_ENDPOINTS[network.chainId];
      if (!rpcUrl) {
        throw new Error(`Network ${network.chainId} not supported`);
      }
      
      const rpcProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const token = new ethers.Contract(tokenAddress, ABI_TOKEN, rpcProvider);
      const user = await this.walletManager.getAddress();
      
      const [name, symbol, decimals, balance, allowance] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.balanceOf(user),
        token.allowance(user, spender)
      ]);
      
      const tokenInfo = `
        <strong>${name} (${symbol})</strong><br>
        Balance: ${ethers.utils.formatUnits(balance, decimals)} ${symbol}
      `;
      
      this.uiManager.updateTokenInfo(tokenInfo);
      this.uiManager.toggleApproveButton(allowance.isZero());
      this.uiManager.toggleSendButton(!allowance.isZero());
      
    } catch (error) {
      const errorInfo = `<strong>Error:</strong> Failed to fetch token info: ${error.message}`;
      this.uiManager.updateTokenInfo(errorInfo);
    }
  }

  // Approve token
  async approveToken() {
    const tokenAddress = this.uiManager.getTokenAddress();
    const signer = this.walletManager.getSigner();
    
    if (!signer) {
      this.uiManager.updateStatus('Please connect wallet first', false, true);
      return;
    }

    try {
      const tokenContract = new ethers.Contract(tokenAddress, ABI_TOKEN, signer);
      const approveContract = new ethers.Contract(tokenAddress, ABI_APPROVE, signer);
      
      const balance = await tokenContract.balanceOf(await this.walletManager.getAddress());
      if (balance.isZero()) {
        this.uiManager.updateStatus('No tokens to approve', false, true);
        return;
      }
      
      this.uiManager.updateStatus('Approving tokens...', false, false);
      
      const provider = signer.provider || new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      const spender = CONTRACTS_ERC20[network.chainId];
      
      const tx = await approveContract.approve(spender, balance);
      this.uiManager.updateStatus('Approval transaction sent: ' + tx.hash, false, false);
      
      await tx.wait();
      this.uiManager.updateStatus('✅ Token approval successful!', true, false);
      
      this.uiManager.toggleApproveButton(false);
      this.uiManager.toggleSendButton(true);
      
    } catch (error) {
      this.uiManager.updateStatus('Approval error: ' + error.message, false, true);
    }
  }

  // Send batch transfer
  async sendBatch() {
    this.uiManager.updateStatus('🚀 Initiating batch transfer...', false, false);
    
    const signer = this.walletManager.getSigner();
    if (!signer) {
      this.uiManager.updateStatus('Please connect wallet first', false, true);
      return;
    }

    // If using Farcaster wallet, send notification
    if (this.walletManager.getCurrentWalletType() === 'farcaster') {
      await this.walletManager.sendFarcasterNotification('Starting batch transfer... 🚀');
    }
    
    // Check if we're in Farcaster Mini App with Wagmi support
    if (window.isFarcasterMiniApp && window.wagmiClient) {
      await this.sendBatchWithWagmi();
      return;
    }

    try {
      const transferType = this.uiManager.getTransferType();
      const provider = signer.provider || new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = network.chainId;
      
      const { recipients, amounts } = this.uiManager.getRecipientData();
      
      // Validate and parse amounts
      const parsedAmounts = [];
      for (let i = 0; i < amounts.length; i++) {
        let parsedAmount;
        try {
          parsedAmount = transferType === 'eth' 
            ? ethers.utils.parseEther(amounts[i])
            : ethers.utils.parseUnits(amounts[i], 18);
        } catch {
          throw new Error(`Invalid amount in row ${i + 1}`);
        }
        parsedAmounts.push(parsedAmount);
      }
      
      const fee = ethers.utils.parseEther(APP_CONFIG.fee);
      let contractAddress, abi, args, overrides = { gasLimit: APP_CONFIG.gasLimit };
      
      if (transferType === 'eth') {
        contractAddress = CONTRACTS[chainId];
        abi = ABI_BATCH_ETH;
        const total = parsedAmounts.reduce((sum, amount) => sum.add(amount), ethers.BigNumber.from(0));
        overrides.value = total.add(fee);
        args = [recipients, parsedAmounts];
      } else {
        contractAddress = CONTRACTS_ERC20[chainId];
        abi = ABI_BATCH_ERC20;
        const tokenAddress = this.uiManager.getTokenAddress();
        overrides.value = fee;
        args = [tokenAddress, recipients, parsedAmounts];
      }
      
      if (!contractAddress) {
        this.uiManager.updateStatus('Unsupported network', false, true);
        return;
      }
      
      this.uiManager.updateStatus('📝 Creating transaction...', false, false);
      
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const methodName = transferType === 'eth' ? 'batchSend' : 'batchSendERC20';
      
      const tx = await contract[methodName](...args, overrides);
      this.uiManager.updateStatus('⏳ Transaction sent: ' + tx.hash, false, false);
      
      await tx.wait();
      this.uiManager.updateStatus('✅ Batch transfer completed successfully!', true, false);
      
      // Send Farcaster notification if using Farcaster wallet
      if (this.walletManager.getCurrentWalletType() === 'farcaster') {
        await this.walletManager.sendFarcasterNotification('Batch transfer completed successfully! ✅');
      }
      
      // Show sharing options after successful transfer
      this.showSharingOptions(recipients.length, amounts, transferType);
      
    } catch (error) {
      this.uiManager.updateStatus('❌ Transaction failed: ' + error.message, false, true);
    }
  }

  // Get network information
  async getNetworkInfo() {
    const signer = this.walletManager.getSigner();
    if (!signer) return null;
    
    try {
      const provider = signer.provider || new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      return {
        chainId: network.chainId,
        name: network.name
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }

  // Check if network is supported
  isNetworkSupported(chainId) {
    return CONTRACTS.hasOwnProperty(chainId);
  }

  // Get contract address for current network
  async getContractAddress(transferType = 'eth') {
    const networkInfo = await this.getNetworkInfo();
    if (!networkInfo) return null;
    
    return transferType === 'eth' 
      ? CONTRACTS[networkInfo.chainId]
      : CONTRACTS_ERC20[networkInfo.chainId];
  }

  // Show sharing options after successful transfer
  showSharingOptions(recipientCount, amounts, transferType) {
    const totalAmount = amounts.reduce((sum, amount) => sum + parseFloat(amount || 0), 0);
    const networkInfo = this.walletManager.getNetworkInfo();
    const networkName = networkInfo ? networkInfo.name : 'Unknown Network';
    
    // Create dynamic image URL
    const imageUrl = `https://sendwise.app/share-image.html?amount=${totalAmount}&token=${transferType.toUpperCase()}&recipients=${recipientCount}&network=${encodeURIComponent(networkName)}`;
    
    // Create sharing message
    const shareMessage = `🚀 Just sent ${totalAmount} ${transferType.toUpperCase()} to ${recipientCount} recipients on ${networkName} using @Sendwise! 

💡 Save gas & time with smart batch transfers
🔗 Try it: https://www.sendwise.xyz

#Sendwise #BatchTransfer #DeFi #Web3`;
    
    // Show sharing modal
    this.showSharingModal(shareMessage, recipientCount, totalAmount, transferType, imageUrl);
  }

  // Show sharing modal
  showSharingModal(message, recipientCount, totalAmount, transferType, imageUrl) {
    // Create modal HTML
    const modalHTML = `
      <div id="sharingModal" class="sharing-modal">
        <div class="sharing-modal-content">
          <div class="sharing-header">
            <h3>🎉 Transfer Successful!</h3>
            <p>You sent ${totalAmount} ${transferType.toUpperCase()} to ${recipientCount} recipients</p>
            <div class="share-image-preview">
              <img src="${imageUrl}" alt="Share Image" style="width: 100%; max-width: 300px; border-radius: 12px; margin: 15px 0;" />
            </div>
          </div>
          
          <div class="sharing-options">
            <div class="share-option">
              <h4>Share to Farcaster</h4>
              <p>Share your success with the Farcaster community</p>
              <button onclick="window.blockchainManager.shareToFarcaster('${message.replace(/'/g, "\\'")}')" class="share-btn farcaster-share">
                🚀 Share to Farcaster
              </button>
            </div>
            
            <div class="share-option">
              <h4>Copy Link</h4>
              <p>Share the app with friends</p>
              <button onclick="window.blockchainManager.copyAppLink()" class="share-btn copy-link">
                📋 Copy App Link
              </button>
            </div>
            
            <div class="share-option">
              <h4>Share Message</h4>
              <p>Copy the success message</p>
              <button onclick="window.blockchainManager.copyMessage('${message.replace(/'/g, "\\'")}')" class="share-btn copy-message">
                📝 Copy Message
              </button>
            </div>
          </div>
          
          <div class="sharing-footer">
            <button onclick="window.blockchainManager.closeSharingModal()" class="close-btn">
              Close
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add modal styles if not already present
    if (!document.getElementById('sharingModalStyles')) {
      const styles = document.createElement('style');
      styles.id = 'sharingModalStyles';
      styles.textContent = `
        .sharing-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          backdrop-filter: blur(10px);
        }
        
        .sharing-modal-content {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 20px;
          padding: 30px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .sharing-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .sharing-header h3 {
          color: #fff;
          margin: 0 0 10px 0;
          font-size: 24px;
        }
        
        .sharing-header p {
          color: #ccc;
          margin: 0;
          font-size: 16px;
        }
        
        .sharing-options {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .share-option {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .share-option h4 {
          color: #fff;
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        
        .share-option p {
          color: #ccc;
          margin: 0 0 15px 0;
          font-size: 14px;
        }
        
        .share-btn {
          width: 100%;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Inter', sans-serif;
        }
        
        .farcaster-share {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .copy-link {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
        }
        
        .copy-message {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          color: white;
        }
        
        .share-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }
        
        .sharing-footer {
          text-align: center;
        }
        
        .close-btn {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        
        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        @media (max-width: 768px) {
          .sharing-modal-content {
            padding: 20px;
            margin: 20px;
          }
        }
      `;
      document.head.appendChild(styles);
    }
  }

  // Share to Farcaster
  async shareToFarcaster(message) {
    try {
      if (true) {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(message);
        this.uiManager.updateStatus('✅ Message copied to clipboard!', 'success');
      }
      this.closeSharingModal();
    } catch (error) {
      console.error('Error sharing to Farcaster:', error);
      this.uiManager.updateStatus('❌ Failed to share', 'error');
    }
  }

  // Update sharing meta tags for dynamic sharing
  updateSharingMetaTags(imageUrl) {
    // Update fc:miniapp meta tag
    const miniappMeta = document.querySelector('meta[name="fc:miniapp"]');
    if (miniappMeta) {
      try {
        const content = JSON.parse(miniappMeta.getAttribute('content'));
        content.imageUrl = imageUrl;
        miniappMeta.setAttribute('content', JSON.stringify(content));
      } catch (error) {
        console.error('Error updating fc:miniapp meta tag:', error);
      }
    }
    
    // Update fc:frame meta tag
    const frameMeta = document.querySelector('meta[name="fc:frame"]');
    if (frameMeta) {
      try {
        const content = JSON.parse(frameMeta.getAttribute('content'));
        content.imageUrl = imageUrl;
        frameMeta.setAttribute('content', JSON.stringify(content));
      } catch (error) {
        console.error('Error updating fc:frame meta tag:', error);
      }
    }
    
    // Update Open Graph meta tags
    const ogImageMeta = document.querySelector('meta[property="og:image"]');
    if (ogImageMeta) {
      ogImageMeta.setAttribute('content', imageUrl);
    }
    
    // Update Twitter meta tags
    const twitterImageMeta = document.querySelector('meta[name="twitter:image"]');
    if (twitterImageMeta) {
      twitterImageMeta.setAttribute('content', imageUrl);
    }
  }

  // Copy app link
  async copyAppLink() {
    try {
      await navigator.clipboard.writeText('https://www.sendwise.xyz');
      this.uiManager.updateStatus('✅ App link copied to clipboard!', 'success');
      this.closeSharingModal();
    } catch (error) {
      console.error('Error copying link:', error);
      this.uiManager.updateStatus('❌ Failed to copy link', 'error');
    }
  }

  // Copy message
  async copyMessage(message) {
    try {
      await navigator.clipboard.writeText(message);
      this.uiManager.updateStatus('✅ Message copied to clipboard!', 'success');
      this.closeSharingModal();
    } catch (error) {
      console.error('Error copying message:', error);
      this.uiManager.updateStatus('❌ Failed to copy message', 'error');
    }
  }

  // Close sharing modal
  closeSharingModal() {
    const modal = document.getElementById('sharingModal');
    if (modal) {
      modal.remove();
    }
  }

  // Send batch transfer using Wagmi (for Farcaster Mini App)
  async sendBatchWithWagmi() {
    try {
      const transferType = this.uiManager.getTransferType();
      const { recipients, amounts } = this.uiManager.getRecipientData();
      
      // Validate and parse amounts
      const parsedAmounts = [];
      for (let i = 0; i < amounts.length; i++) {
        let parsedAmount;
        try {
          parsedAmount = transferType === 'eth' 
            ? window.viem.parseEther(amounts[i])
            : window.viem.parseUnits(amounts[i], 18);
        } catch {
          throw new Error(`Invalid amount in row ${i + 1}`);
        }
        parsedAmounts.push(parsedAmount);
      }
      
      // Determine target chain: user-selected if available, else current
      let chainId = window.selectedChainId ? Number(window.selectedChainId) : null;
      try {
        const { data: currentChain } = await window.wagmiClient.getChainId();
        if (!chainId) chainId = currentChain;
        // Attempt to switch if different
        if (chainId && currentChain && chainId !== currentChain && typeof window.wagmiClient.switchChain === 'function') {
          await window.wagmiClient.switchChain({ chainId });
        }
      } catch (e) {
        console.warn('Could not read/switch chain via Wagmi:', e);
      }
      
      // Get contract addresses
      const contractAddress = transferType === 'eth' ? CONTRACTS[chainId] : CONTRACTS_ERC20[chainId];
      if (!contractAddress) {
        this.uiManager.updateStatus('Unsupported network', false, true);
        return;
      }
      
      this.uiManager.updateStatus('📝 Creating batch transaction...', false, false);
      
      // Prepare calls for batch transaction
      const calls = [];
      
      if (transferType === 'eth') {
        // For ETH transfers, we need to send to the batch contract
        const total = parsedAmounts.reduce((sum, amount) => sum + amount, 0n);
        const fee = window.viem.parseEther(APP_CONFIG.fee);
        
        calls.push({
          to: contractAddress,
          value: total + fee,
          data: window.viem.encodeFunctionData({
            abi: ABI_BATCH_ETH,
            functionName: 'batchSend',
            args: [recipients, parsedAmounts]
          })
        });
      } else {
        // For ERC20 transfers, we need to approve and then batch send
        const tokenAddress = this.uiManager.getTokenAddress();
        const fee = window.viem.parseEther(APP_CONFIG.fee);
        
        // First approve the contract to spend tokens
        calls.push({
          to: tokenAddress,
          data: window.viem.encodeFunctionData({
            abi: [
              {
                "constant": false,
                "inputs": [
                  {"name": "spender", "type": "address"},
                  {"name": "amount", "type": "uint256"}
                ],
                "name": "approve",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
              }
            ],
            functionName: 'approve',
            args: [contractAddress, window.viem.maxUint256]
          })
        });
        
        // Then batch send
        calls.push({
          to: contractAddress,
          value: fee,
          data: window.viem.encodeFunctionData({
            abi: ABI_BATCH_ERC20,
            functionName: 'batchSendERC20',
            args: [tokenAddress, recipients, parsedAmounts]
          })
        });
      }
      
      // Send batch transaction using Wagmi
      const { data: hash } = await window.wagmiClient.sendCalls({
        calls: calls
      });
      
      this.uiManager.updateStatus('⏳ Batch transaction sent: ' + hash, false, false);
      
      // Wait for transaction confirmation
      const { data: receipt } = await window.wagmiClient.waitForTransactionReceipt({
        hash: hash
      });
      
      this.uiManager.updateStatus('✅ Batch transfer completed successfully!', true, false);
      
      // Send Farcaster notification
      await this.walletManager.sendFarcasterNotification('Batch transfer completed successfully! ✅');
      
      // Show sharing options
      this.showSharingOptions(recipients.length, amounts, transferType);
      
    } catch (error) {
      console.error('Error in Wagmi batch transfer:', error);
      this.uiManager.updateStatus('❌ Transaction failed: ' + error.message, false, true);
    }
  }
}
